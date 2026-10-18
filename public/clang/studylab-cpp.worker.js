/* StudyLab C++ 3.0 - classic Web Worker. Requires clang-wasm.global.js and runtime assets.
   Clang and linked program run entirely inside the worker. Terminating the worker stops them. */
importScripts('./clang-wasm.global.js');

let compilerPromise = null;
let lastProgress = -1;
function errorText(err) { return err instanceof Error ? err.message : String(err); }
function getCompiler(standard) {
  if (!self.clangWasm || typeof self.clangWasm.createCompiler !== 'function') {
    throw new Error('Brak silnika Clang/WASM. Uruchom instalator StudyLab 5.3 ponownie.');
  }
  if (!compilerPromise) {
    compilerPromise = self.clangWasm.createCompiler('cpp', {
      baseUrl: new URL('./', self.location.href).href,
      std: standard,
      compileArgs: ['-Wall', '-Wextra'],
      onProgress: (value) => {
        const percent = Math.round(Number(value) * 100);
        if (percent !== lastProgress) {
          lastProgress = percent;
          self.postMessage({ type: 'progress', value: Number(value) || 0 });
        }
      },
    });
  }
  return compilerPromise;
}
self.onmessage = async (event) => {
  const msg = event.data || {};
  if (msg.type !== 'run') return;
  try {
    const compiler = await getCompiler(msg.standard || 'gnu++17');
    self.postMessage({ type: 'ready' });
    const outcome = await compiler.run(String(msg.source || ''), String(msg.stdin || ''), {
      std: msg.standard || 'gnu++17',
      fileName: 'main.cpp',
    });
    self.postMessage({ type: 'finished', result: {
      stdout: String(outcome.stdout || ''),
      stderr: String(outcome.stderr || ''),
      errors: Array.isArray(outcome.errors) ? outcome.errors.map(String) : [],
      exitCode: Number.isInteger(outcome.exitCode) ? outcome.exitCode : null,
      compileMs: Number(outcome.compileMs) || null,
      runMs: Number(outcome.runMs) || null,
    }});
  } catch (e) {
    compilerPromise = null;
    self.postMessage({ type: 'failed', message: errorText(e) });
  }
};
