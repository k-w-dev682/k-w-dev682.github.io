export const SCENARIOS = {
 loop: {title:'Pętla: suma 1 + 2 + 3', steps:[
 ['int suma = 0; int i = 1;', {i:1,suma:0}, 'Przygotowanie przed pierwszym sprawdzeniem.'],
 ['i <= 3 → true', {i:1,suma:0}, 'Warunek dopuszcza pierwszy obieg; suma jeszcze się nie zmieniła.'],
 ['suma += i;', {i:1,suma:1}, '0 + 1 daje 1.'],
 ['++i; i <= 3 → true', {i:2,suma:1}, 'Zwiększamy i po ciele; drugi obieg jest dozwolony.'],
 ['suma += i;', {i:2,suma:3}, '1 + 2 daje 3.'],
 ['++i; i <= 3 → true', {i:3,suma:3}, 'Przygotowanie trzeciego obiegu.'],
 ['suma += i;', {i:3,suma:6}, '3 + 3 daje 6.'],
 ['++i; i <= 3 → false', {i:4,suma:6}, 'Koniec: ciało nie wykona się dla i = 4. W rzeczywistym for lokalne i kończy tu swój zakres.']
 ]},
 function: {title:'Funkcja: suma(3, 4)', steps:[
 ['int x = 3;', {'main: x':3}, 'W main istnieje x. Funkcja suma jeszcze nie została wywołana.'],
 ['suma(x, 4)', {'main: x':3,'suma: a':3,'suma: b':4}, 'Wywołanie tworzy osobne parametry, będące kopiami wartości argumentów.'],
 ['int wynik = a + b;', {'main: x':3,'suma: a':3,'suma: b':4,'suma: wynik':7}, 'Wewnątrz funkcji powstaje lokalny wynik.'],
 ['return wynik;', {'main: x':3,'zwracana wartość':7}, 'Wartość wraca do wywołującego; lokalne obiekty funkcji kończą życie.'],
 ['int y = 7;', {'main: x':3,'main: y':7}, 'y otrzymuje zwróconą wartość. x nie zostało zmienione.']
 ]},
 reference: {title:'Kopia a referencja', steps:[
 ['int x = 5;', {x:5}, 'Jeden obiekt przechowujący 5.'],
 ['int kopia = x;', {x:5,kopia:5}, 'Dwa niezależne obiekty o tej samej wartości.'],
 ['int& alias = x;', {'x (także alias)':5,kopia:5}, 'Nie tworzymy trzeciej kopii liczby. alias nazywa x.'],
 ['alias += 2;', {'x (także alias)':7,kopia:5}, 'Zmiana przez alias dotyczy x, lecz nie kopii.'],
 ['kopia += 10;', {'x (także alias)':7,kopia:15}, 'Zmiana kopii nie wpływa na x.']
 ]},
 pointer: {title:'Wskaźnik: adres i zawartość', steps:[
 ['int x = 5, y = 9;', {x:5,y:9}, 'Dwa obiekty. Używamy symbolicznych adresów &x i &y.'],
 ['int* p = &x;', {x:5,y:9,p:'adres x'}, 'p przechowuje adres x, nie kopię 5.'],
 ['*p = 7;', {x:7,y:9,p:'adres x'}, 'Gwiazdka daje dostęp do wskazywanego obiektu; zmieniamy x.'],
 ['p = &y;', {x:7,y:9,p:'adres y'}, 'Zmienia się sam adres w p. Obie liczby pozostają bez zmian.'],
 ['*p += 1;', {x:7,y:10,p:'adres y'}, 'Teraz zmieniamy y, ponieważ do niego prowadzi p.'],
 ['p = nullptr;', {x:7,y:10,p:'brak obiektu'}, 'Nie wolno odczytać *p. x i y nadal istnieją w swoim bloku.']
 ]}
};
