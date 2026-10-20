---
title: Wprowadzenie do C++
description: Pierwsze kroki w programowaniu
---

# Wprowadzenie do C++

C++ jest językiem programowania,
który pozwala tworzyć aplikacje,
gry i inne programy.

## Pierwszy program

```cpp
#include <iostream>

int main() {
    std::cout << "Witaj w StudyLab!";
    return 0;
}
```

## Co oznaczają instrukcje?

- `#include` — dołącza bibliotekę.
- `int main()` — funkcja główna programu.
- `std::cout` — wypisuje tekst.
- `return 0` — kończy program z kodem sukcesu.

## Zacznij od pełnej ścieżki

[Od zera: instrukcje i pierwszy program](../wstep/) wyjaśnia każdy symbol, pokazuje wartości zmiennych i daje ćwiczenia z odpowiedziami. [Spis treści](../spis-tresci/) obejmuje 44 lekcje.

`std::cout << "2 + 3";` wypisze tekst 2 + 3, natomiast `std::cout << 2 + 3;` wypisze 5. Cudzysłowy zmieniają znaczenie: komputer nie oblicza działania zapisanego w napisie.
