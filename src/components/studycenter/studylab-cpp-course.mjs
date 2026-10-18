// StudyLab C++ — course catalog. Exercises are educational, client-side and not a secure examination system.
export const COURSE_MODULES = [
  {
    "id": 1,
    "title": "Podstawy C++",
    "description": "Zmienne, operatory, argumenty i zwracanie wartości"
  },
  {
    "id": 2,
    "title": "Warunki",
    "description": "if, else, operatory logiczne i progi"
  },
  {
    "id": 3,
    "title": "Pętle",
    "description": "for, while i proste algorytmy iteracyjne"
  },
  {
    "id": 4,
    "title": "Funkcje i rekurencja",
    "description": "Rozbijanie problemu na funkcje, przypadki bazowe"
  },
  {
    "id": 5,
    "title": "Wektory i tablice",
    "description": "Iterowanie, indeksy, wyszukiwanie, obliczenia"
  },
  {
    "id": 6,
    "title": "Napisy",
    "description": "std::string, znaki, odczyt słów"
  },
  {
    "id": 7,
    "title": "Referencje i wskaźniki",
    "description": "Adresy, dereferencja, przekazywanie przez referencję"
  },
  {
    "id": 8,
    "title": "Struktury",
    "description": "Pola struktur, wektory obiektów i agregaty"
  },
  {
    "id": 9,
    "title": "Strumienie i pliki",
    "description": "Odczyt i zapis danych przez istream/ostream (te same API co przy plikach)"
  },
  {
    "id": 10,
    "title": "Algorytmy",
    "description": "Wyszukiwanie, sortowanie, zbiór wartości, porządek"
  }
];

export const COURSE_TASKS = [
  {
    "module": 1,
    "id": "dodaj",
    "title": "Dodaj dwie liczby",
    "fn": "dodaj",
    "description": "Napisz funkcję zwracającą sumę dwóch liczb całkowitych.",
    "starter": "int dodaj(int a, int b) {\n    // TODO: zwróć sumę\n    return 0;\n}\n",
    "hint": "Możesz zwrócić wynik działania a + b.",
    "tests": [
      {
        "call": "dodaj(2,3)",
        "expected": "5"
      },
      {
        "call": "dodaj(-5,8)",
        "expected": "3"
      },
      {
        "call": "dodaj(0,0)",
        "expected": "0"
      },
      {
        "call": "dodaj(19,-19)",
        "expected": "0"
      }
    ],
    "level": 1,
    "why": "Zwróć sumę parametrów zamiast ją wypisywać."
  },
  {
    "module": 1,
    "id": "roznica",
    "title": "Oblicz różnicę",
    "fn": "roznica",
    "description": "Zwróć wynik odejmowania b od a.",
    "starter": "int roznica(int a, int b) {\n    return 0;\n}\n",
    "hint": "Operator odejmowania to -.",
    "tests": [
      {
        "call": "roznica(9,4)",
        "expected": "5"
      },
      {
        "call": "roznica(0,7)",
        "expected": "-7"
      },
      {
        "call": "roznica(-3,-8)",
        "expected": "5"
      },
      {
        "call": "roznica(10,10)",
        "expected": "0"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 1,
    "id": "pole-prostokata",
    "title": "Pole prostokąta",
    "fn": "pole",
    "description": "Policz pole prostokąta z boków a i b.",
    "starter": "int pole(int a, int b) {\n    return 0;\n}\n",
    "hint": "Pole to a * b.",
    "tests": [
      {
        "call": "pole(2,3)",
        "expected": "6"
      },
      {
        "call": "pole(0,9)",
        "expected": "0"
      },
      {
        "call": "pole(12,5)",
        "expected": "60"
      },
      {
        "call": "pole(1,1)",
        "expected": "1"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 1,
    "id": "reszta",
    "title": "Reszta z dzielenia",
    "fn": "reszta",
    "description": "Zwróć resztę z dzielenia a przez dodatnią liczbę b.",
    "starter": "int reszta(int a, int b) {\n    return 0;\n}\n",
    "hint": "Operator modulo: %.",
    "tests": [
      {
        "call": "reszta(10,3)",
        "expected": "1"
      },
      {
        "call": "reszta(15,5)",
        "expected": "0"
      },
      {
        "call": "reszta(2,8)",
        "expected": "2"
      },
      {
        "call": "reszta(101,10)",
        "expected": "1"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 1,
    "id": "srednia",
    "title": "Średnia dwóch liczb",
    "fn": "srednia",
    "description": "Zwróć średnią arytmetyczną dwóch liczb jako double.",
    "starter": "double srednia(double a, double b) {\n    return 0;\n}\n",
    "hint": "Dziel przez 2.0.",
    "tests": [
      {
        "call": "srednia(2.0,4.0)",
        "expected": "3"
      },
      {
        "call": "srednia(1.0,2.0)",
        "expected": "1.5"
      },
      {
        "call": "srednia(-4.0,8.0)",
        "expected": "2"
      },
      {
        "call": "srednia(0.0,0.0)",
        "expected": "0"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 1,
    "id": "zamien-celsjusze",
    "title": "Celsjusze na Fahrenheity",
    "fn": "fahrenheit",
    "description": "Przelicz stopnie Celsjusza na Fahrenheita.",
    "starter": "double fahrenheit(double c) {\n    return 0;\n}\n",
    "hint": "F = C * 9.0 / 5.0 + 32.",
    "tests": [
      {
        "call": "fahrenheit(0.0)",
        "expected": "32"
      },
      {
        "call": "fahrenheit(100.0)",
        "expected": "212"
      },
      {
        "call": "fahrenheit(-40.0)",
        "expected": "-40"
      },
      {
        "call": "fahrenheit(20.0)",
        "expected": "68"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 2,
    "id": "parzysta",
    "title": "Czy liczba jest parzysta?",
    "fn": "parzysta",
    "description": "Zwróć true dla liczby parzystej, false dla nieparzystej.",
    "starter": "bool parzysta(int n) {\n    return false;\n}\n",
    "hint": "Sprawdź n % 2 == 0.",
    "tests": [
      {
        "call": "parzysta(0)",
        "expected": "1"
      },
      {
        "call": "parzysta(2)",
        "expected": "1"
      },
      {
        "call": "parzysta(9)",
        "expected": "0"
      },
      {
        "call": "parzysta(-8)",
        "expected": "1"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 2,
    "id": "maksimum",
    "title": "Większa z dwóch",
    "fn": "maksimum",
    "description": "Zwróć większą z dwóch liczb; dla równych zwróć tę wartość.",
    "starter": "int maksimum(int a, int b) {\n    return 0;\n}\n",
    "hint": "Użyj warunku if (a > b).",
    "tests": [
      {
        "call": "maksimum(2,5)",
        "expected": "5"
      },
      {
        "call": "maksimum(10,-1)",
        "expected": "10"
      },
      {
        "call": "maksimum(4,4)",
        "expected": "4"
      },
      {
        "call": "maksimum(-9,-3)",
        "expected": "-3"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 2,
    "id": "znak",
    "title": "Znak liczby",
    "fn": "znak",
    "description": "Zwróć -1 dla ujemnej, 0 dla zera i 1 dla dodatniej.",
    "starter": "int znak(int n) {\n    return 0;\n}\n",
    "hint": "Rozważ n < 0 i n > 0.",
    "tests": [
      {
        "call": "znak(-20)",
        "expected": "-1"
      },
      {
        "call": "znak(0)",
        "expected": "0"
      },
      {
        "call": "znak(7)",
        "expected": "1"
      },
      {
        "call": "znak(-1)",
        "expected": "-1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 2,
    "id": "rok-przestepny",
    "title": "Rok przestępny",
    "fn": "przestepny",
    "description": "Rok jest przestępny, gdy dzieli się przez 400 albo przez 4 i nie przez 100.",
    "starter": "bool przestepny(int rok) {\n    return false;\n}\n",
    "hint": "Połącz dwa warunki operatorami || i &&.",
    "tests": [
      {
        "call": "przestepny(2000)",
        "expected": "1"
      },
      {
        "call": "przestepny(1900)",
        "expected": "0"
      },
      {
        "call": "przestepny(2024)",
        "expected": "1"
      },
      {
        "call": "przestepny(2023)",
        "expected": "0"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 2,
    "id": "w-przedziale",
    "title": "W zamkniętym przedziale",
    "fn": "wPrzedziale",
    "description": "Sprawdź, czy x znajduje się w [a,b], przy a <= b.",
    "starter": "bool wPrzedziale(int x, int a, int b) {\n    return false;\n}\n",
    "hint": "Użyj x >= a && x <= b.",
    "tests": [
      {
        "call": "wPrzedziale(5,1,10)",
        "expected": "1"
      },
      {
        "call": "wPrzedziale(1,1,10)",
        "expected": "1"
      },
      {
        "call": "wPrzedziale(11,1,10)",
        "expected": "0"
      },
      {
        "call": "wPrzedziale(-1,-5,0)",
        "expected": "1"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 2,
    "id": "ocena",
    "title": "Ocena z procentów",
    "fn": "ocena",
    "description": "Dla wyniku 0–100 zwróć: 2 (<50), 3 (50–69), 4 (70–84), 5 (85–94), 6 (95–100).",
    "starter": "int ocena(int procent) {\n    return 2;\n}\n",
    "hint": "Sprawdzaj progi od najwyższego lub najniższego.",
    "tests": [
      {
        "call": "ocena(49)",
        "expected": "2"
      },
      {
        "call": "ocena(50)",
        "expected": "3"
      },
      {
        "call": "ocena(70)",
        "expected": "4"
      },
      {
        "call": "ocena(85)",
        "expected": "5"
      },
      {
        "call": "ocena(95)",
        "expected": "6"
      },
      {
        "call": "ocena(100)",
        "expected": "6"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 3,
    "id": "suma-do-n",
    "title": "Suma od 1 do n",
    "fn": "sumaDoN",
    "description": "Dla n >= 0 zwróć sumę liczb od 1 do n.",
    "starter": "int sumaDoN(int n) {\n    int suma = 0;\n    // TODO: pętla\n    return suma;\n}\n",
    "hint": "Użyj for (int i = 1; i <= n; ++i).",
    "tests": [
      {
        "call": "sumaDoN(0)",
        "expected": "0"
      },
      {
        "call": "sumaDoN(1)",
        "expected": "1"
      },
      {
        "call": "sumaDoN(5)",
        "expected": "15"
      },
      {
        "call": "sumaDoN(10)",
        "expected": "55"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 3,
    "id": "silnia",
    "title": "Silnia",
    "fn": "silnia",
    "description": "Oblicz n! dla 0 <= n <= 12.",
    "starter": "long long silnia(int n) {\n    long long wynik = 1;\n    return wynik;\n}\n",
    "hint": "Mnoż przez kolejne liczby od 2 do n.",
    "tests": [
      {
        "call": "silnia(0)",
        "expected": "1"
      },
      {
        "call": "silnia(1)",
        "expected": "1"
      },
      {
        "call": "silnia(5)",
        "expected": "120"
      },
      {
        "call": "silnia(10)",
        "expected": "3628800"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 3,
    "id": "cyfry",
    "title": "Liczba cyfr",
    "fn": "liczbaCyfr",
    "description": "Policz cyfry liczby nieujemnej. Zero ma jedną cyfrę.",
    "starter": "int liczbaCyfr(int n) {\n    return 0;\n}\n",
    "hint": "Dziel liczbę przez 10 aż do zera; obsłuż n=0.",
    "tests": [
      {
        "call": "liczbaCyfr(0)",
        "expected": "1"
      },
      {
        "call": "liczbaCyfr(9)",
        "expected": "1"
      },
      {
        "call": "liczbaCyfr(10)",
        "expected": "2"
      },
      {
        "call": "liczbaCyfr(123456)",
        "expected": "6"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 3,
    "id": "suma-cyfr",
    "title": "Suma cyfr",
    "fn": "sumaCyfr",
    "description": "Zwróć sumę cyfr nieujemnej liczby n.",
    "starter": "int sumaCyfr(int n) {\n    return 0;\n}\n",
    "hint": "W pętli dodawaj n % 10, potem n /= 10.",
    "tests": [
      {
        "call": "sumaCyfr(0)",
        "expected": "0"
      },
      {
        "call": "sumaCyfr(123)",
        "expected": "6"
      },
      {
        "call": "sumaCyfr(909)",
        "expected": "18"
      },
      {
        "call": "sumaCyfr(5006)",
        "expected": "11"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 3,
    "id": "potega",
    "title": "Potęgowanie pętlą",
    "fn": "potega",
    "description": "Policz podstawa^wykladnik dla wykładnika 0–10 bez pow().",
    "starter": "long long potega(int podstawa, int wykladnik) {\n    return 1;\n}\n",
    "hint": "Wynik zacznij od 1 i mnoż tyle razy, ile wynosi wykładnik.",
    "tests": [
      {
        "call": "potega(2,0)",
        "expected": "1"
      },
      {
        "call": "potega(2,5)",
        "expected": "32"
      },
      {
        "call": "potega(-2,3)",
        "expected": "-8"
      },
      {
        "call": "potega(3,4)",
        "expected": "81"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 3,
    "id": "nwd",
    "title": "NWD",
    "fn": "nwd",
    "description": "Zwróć NWD dwóch nieujemnych liczb algorytmem Euklidesa.",
    "starter": "int nwd(int a, int b) {\n    return 0;\n}\n",
    "hint": "Dopóki b != 0, wykonuj: r = a % b; a = b; b = r.",
    "tests": [
      {
        "call": "nwd(12,18)",
        "expected": "6"
      },
      {
        "call": "nwd(7,13)",
        "expected": "1"
      },
      {
        "call": "nwd(0,5)",
        "expected": "5"
      },
      {
        "call": "nwd(24,24)",
        "expected": "24"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 4,
    "id": "abs",
    "title": "Własna wartość bezwzględna",
    "fn": "wartoscBezwzgledna",
    "description": "Zaimplementuj wartość bezwzględną bez abs().",
    "starter": "int wartoscBezwzgledna(int x) {\n    return 0;\n}\n",
    "hint": "Jeśli x < 0, zwróć -x; inaczej x.",
    "tests": [
      {
        "call": "wartoscBezwzgledna(-8)",
        "expected": "8"
      },
      {
        "call": "wartoscBezwzgledna(0)",
        "expected": "0"
      },
      {
        "call": "wartoscBezwzgledna(14)",
        "expected": "14"
      },
      {
        "call": "wartoscBezwzgledna(-1)",
        "expected": "1"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 4,
    "id": "fibonacci",
    "title": "Fibonacci rekurencyjnie",
    "fn": "fib",
    "description": "Zwróć n-ty wyraz ciągu Fibonacciego (fib(0)=0, fib(1)=1). Dla n <= 16.",
    "starter": "int fib(int n) {\n    return 0;\n}\n",
    "hint": "Dla n <= 1 zwróć n, inaczej fib(n-1)+fib(n-2).",
    "tests": [
      {
        "call": "fib(0)",
        "expected": "0"
      },
      {
        "call": "fib(1)",
        "expected": "1"
      },
      {
        "call": "fib(7)",
        "expected": "13"
      },
      {
        "call": "fib(10)",
        "expected": "55"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 4,
    "id": "rek-suma",
    "title": "Suma rekurencyjna",
    "fn": "rekSuma",
    "description": "Zwróć sumę 1..n dla n >= 0 z użyciem rekurencji.",
    "starter": "int rekSuma(int n) {\n    return 0;\n}\n",
    "hint": "Dla n == 0 zwróć 0; dla reszty n + rekSuma(n-1).",
    "tests": [
      {
        "call": "rekSuma(0)",
        "expected": "0"
      },
      {
        "call": "rekSuma(1)",
        "expected": "1"
      },
      {
        "call": "rekSuma(4)",
        "expected": "10"
      },
      {
        "call": "rekSuma(10)",
        "expected": "55"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 4,
    "id": "pierwsza",
    "title": "Czy liczba jest pierwsza?",
    "fn": "pierwsza",
    "description": "Zwróć true dla liczb pierwszych. Liczby <=1 nie są pierwsze.",
    "starter": "bool pierwsza(int n) {\n    return false;\n}\n",
    "hint": "Dla n<2 false. Szukaj dzielnika od 2, dopóki i*i <= n.",
    "tests": [
      {
        "call": "pierwsza(2)",
        "expected": "1"
      },
      {
        "call": "pierwsza(13)",
        "expected": "1"
      },
      {
        "call": "pierwsza(21)",
        "expected": "0"
      },
      {
        "call": "pierwsza(1)",
        "expected": "0"
      },
      {
        "call": "pierwsza(97)",
        "expected": "1"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 4,
    "id": "znajdz-dzielnik",
    "title": "Najmniejszy dzielnik",
    "fn": "dzielnik",
    "description": "Dla n >= 2 zwróć najmniejszy dzielnik większy od 1.",
    "starter": "int dzielnik(int n) {\n    return 0;\n}\n",
    "hint": "Sprawdzaj kolejne liczby od 2 do n.",
    "tests": [
      {
        "call": "dzielnik(2)",
        "expected": "2"
      },
      {
        "call": "dzielnik(15)",
        "expected": "3"
      },
      {
        "call": "dzielnik(49)",
        "expected": "7"
      },
      {
        "call": "dzielnik(17)",
        "expected": "17"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 4,
    "id": "rek-potega",
    "title": "Potęga rekurencyjnie",
    "fn": "rekPotega",
    "description": "Policz a^n dla 0 <= n <= 10 rekurencyjnie.",
    "starter": "long long rekPotega(int a, int n) {\n    return 1;\n}\n",
    "hint": "Dla n=0 zwróć 1; inaczej a * rekPotega(a,n-1).",
    "tests": [
      {
        "call": "rekPotega(2,0)",
        "expected": "1"
      },
      {
        "call": "rekPotega(2,4)",
        "expected": "16"
      },
      {
        "call": "rekPotega(-3,3)",
        "expected": "-27"
      },
      {
        "call": "rekPotega(5,2)",
        "expected": "25"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 5,
    "id": "wektor-suma",
    "title": "Suma wektora",
    "fn": "sumaWektora",
    "description": "Oblicz sumę elementów wektora.",
    "starter": "int sumaWektora(const vector<int>& v) {\n    return 0;\n}\n",
    "hint": "Użyj pętli for (int x : v).",
    "tests": [
      {
        "call": "sumaWektora(vector<int>{})",
        "expected": "0"
      },
      {
        "call": "sumaWektora(vector<int>{1,2,3})",
        "expected": "6"
      },
      {
        "call": "sumaWektora(vector<int>{-5,5})",
        "expected": "0"
      },
      {
        "call": "sumaWektora(vector<int>{9})",
        "expected": "9"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 5,
    "id": "wektor-max",
    "title": "Maksimum wektora",
    "fn": "maxWektora",
    "description": "Zwróć największy element niepustego wektora.",
    "starter": "int maxWektora(const vector<int>& v) {\n    return 0;\n}\n",
    "hint": "Ustaw maksimum na v[0] i sprawdzaj kolejne elementy.",
    "tests": [
      {
        "call": "maxWektora(vector<int>{3,8,2})",
        "expected": "8"
      },
      {
        "call": "maxWektora(vector<int>{-5,-2,-8})",
        "expected": "-2"
      },
      {
        "call": "maxWektora(vector<int>{9})",
        "expected": "9"
      },
      {
        "call": "maxWektora(vector<int>{7,7,7})",
        "expected": "7"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 5,
    "id": "licz-parzyste",
    "title": "Zlicz parzyste elementy",
    "fn": "liczParzyste",
    "description": "Policz, ile liczb parzystych jest w wektorze.",
    "starter": "int liczParzyste(const vector<int>& v) {\n    return 0;\n}\n",
    "hint": "Dla każdego x sprawdź x % 2 == 0.",
    "tests": [
      {
        "call": "liczParzyste(vector<int>{})",
        "expected": "0"
      },
      {
        "call": "liczParzyste(vector<int>{1,2,3,4})",
        "expected": "2"
      },
      {
        "call": "liczParzyste(vector<int>{0,-2,6})",
        "expected": "3"
      },
      {
        "call": "liczParzyste(vector<int>{1,3,5})",
        "expected": "0"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 5,
    "id": "odwroc-wektor",
    "title": "Odwróć wektor",
    "fn": "odwroc",
    "description": "Zwróć nowy wektor z elementami w odwrotnej kolejności.",
    "starter": "vector<int> odwroc(const vector<int>& v) {\n    return {};\n}\n",
    "hint": "Możesz użyć kopii i std::reverse lub pętli od końca.",
    "tests": [
      {
        "call": "([](){ auto v=odwroc(vector<int>{1,2,3}); stringstream s; for(int x:v)s<<x<<\",\"; return s.str(); })()",
        "expected": "3,2,1,"
      },
      {
        "call": "([](){ auto v=odwroc(vector<int>{}); return v.size(); })()",
        "expected": "0"
      },
      {
        "call": "([](){ auto v=odwroc(vector<int>{-2,4}); stringstream s; for(int x:v)s<<x<<\",\"; return s.str(); })()",
        "expected": "4,-2,"
      },
      {
        "call": "([](){ auto v=odwroc(vector<int>{9}); return v[0]; })()",
        "expected": "9"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 5,
    "id": "srednia-wektora",
    "title": "Średnia wektora",
    "fn": "sredniaWektora",
    "description": "Zwróć średnią niepustego wektora jako double.",
    "starter": "double sredniaWektora(const vector<int>& v) {\n    return 0.0;\n}\n",
    "hint": "Zsumuj elementy i podziel przez double(v.size()).",
    "tests": [
      {
        "call": "sredniaWektora(vector<int>{2,4,6})",
        "expected": "4"
      },
      {
        "call": "sredniaWektora(vector<int>{1,2})",
        "expected": "1.5"
      },
      {
        "call": "sredniaWektora(vector<int>{-3,3})",
        "expected": "0"
      },
      {
        "call": "sredniaWektora(vector<int>{10})",
        "expected": "10"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 5,
    "id": "indeks-min",
    "title": "Indeks minimum",
    "fn": "indeksMinimum",
    "description": "Zwróć indeks pierwszego najmniejszego elementu niepustego wektora.",
    "starter": "int indeksMinimum(const vector<int>& v) {\n    return 0;\n}\n",
    "hint": "Porównuj v[i] z v[indeks]; aktualizuj tylko gdy mniejsze.",
    "tests": [
      {
        "call": "indeksMinimum(vector<int>{5,2,3})",
        "expected": "1"
      },
      {
        "call": "indeksMinimum(vector<int>{-1,-1,0})",
        "expected": "0"
      },
      {
        "call": "indeksMinimum(vector<int>{7})",
        "expected": "0"
      },
      {
        "call": "indeksMinimum(vector<int>{4,3,2,1})",
        "expected": "3"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 6,
    "id": "dlugosc-napisu",
    "title": "Długość napisu",
    "fn": "dlugosc",
    "description": "Zwróć liczbę znaków napisu std::string.",
    "starter": "int dlugosc(const string& s) {\n    return 0;\n}\n",
    "hint": "Metoda s.size() zwraca liczbę znaków (bajtów).",
    "tests": [
      {
        "call": "dlugosc(\"\")",
        "expected": "0"
      },
      {
        "call": "dlugosc(\"abc\")",
        "expected": "3"
      },
      {
        "call": "dlugosc(\"a b\")",
        "expected": "3"
      },
      {
        "call": "dlugosc(\"program\")",
        "expected": "7"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 6,
    "id": "samogloski",
    "title": "Zlicz samogłoski",
    "fn": "samogloski",
    "description": "Policz angielskie samogłoski a,e,i,o,u niezależnie od wielkości liter.",
    "starter": "int samogloski(const string& s) {\n    return 0;\n}\n",
    "hint": "Dla każdego c użyj tolower i porównaj z a/e/i/o/u.",
    "tests": [
      {
        "call": "samogloski(\"Ala\")",
        "expected": "2"
      },
      {
        "call": "samogloski(\"BCDF\")",
        "expected": "0"
      },
      {
        "call": "samogloski(\"AEIOU\")",
        "expected": "5"
      },
      {
        "call": "samogloski(\"study lab\")",
        "expected": "2"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 6,
    "id": "palindrom",
    "title": "Palindrom",
    "fn": "palindrom",
    "description": "Zwróć true, gdy napis jest identyczny czytany od początku i od końca (wielkość liter ma znaczenie).",
    "starter": "bool palindrom(const string& s) {\n    return false;\n}\n",
    "hint": "Porównuj s[i] z s[s.size()-1-i].",
    "tests": [
      {
        "call": "palindrom(\"\")",
        "expected": "1"
      },
      {
        "call": "palindrom(\"kajak\")",
        "expected": "1"
      },
      {
        "call": "palindrom(\"abc\")",
        "expected": "0"
      },
      {
        "call": "palindrom(\"Ala\")",
        "expected": "0"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 6,
    "id": "usun-spacje",
    "title": "Usuń spacje",
    "fn": "usunSpacje",
    "description": "Zwróć napis bez zwykłych spacji (znak ASCII 32).",
    "starter": "string usunSpacje(const string& s) {\n    return \"\";\n}\n",
    "hint": "Dodawaj znak do wyniku tylko wtedy, gdy c != znak spacji.",
    "tests": [
      {
        "call": "usunSpacje(\"a b c\")",
        "expected": "abc"
      },
      {
        "call": "usunSpacje(\"   \")",
        "expected": ""
      },
      {
        "call": "usunSpacje(\"abc\")",
        "expected": "abc"
      },
      {
        "call": "usunSpacje(\" a  b \")",
        "expected": "ab"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 6,
    "id": "odwroc-napis",
    "title": "Odwróć napis",
    "fn": "odwrocNapis",
    "description": "Zwróć nowy napis ze znakami w odwrotnej kolejności.",
    "starter": "string odwrocNapis(const string& s) {\n    return \"\";\n}\n",
    "hint": "Możesz użyć reverse na kopii napisu.",
    "tests": [
      {
        "call": "odwrocNapis(\"abc\")",
        "expected": "cba"
      },
      {
        "call": "odwrocNapis(\"\")",
        "expected": ""
      },
      {
        "call": "odwrocNapis(\"12345\")",
        "expected": "54321"
      },
      {
        "call": "odwrocNapis(\"abba\")",
        "expected": "abba"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 6,
    "id": "policz-slowa",
    "title": "Policz słowa",
    "fn": "liczSlowa",
    "description": "Policz słowa oddzielone dowolną białą spacją.",
    "starter": "int liczSlowa(const string& s) {\n    return 0;\n}\n",
    "hint": "Wykorzystaj istringstream i operator >> do stringa.",
    "tests": [
      {
        "call": "liczSlowa(\"\")",
        "expected": "0"
      },
      {
        "call": "liczSlowa(\"Ala ma kota\")",
        "expected": "3"
      },
      {
        "call": "liczSlowa(\"  abc  \")",
        "expected": "1"
      },
      {
        "call": "liczSlowa(\"a\\tb\\nc\")",
        "expected": "3"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 7,
    "id": "zwieksz-referencja",
    "title": "Zwiększ przez referencję",
    "fn": "zwieksz",
    "description": "Zwiększ przekazaną liczbę o jeden, używając parametru int&.",
    "starter": "void zwieksz(int& x) {\n    // TODO\n}\n",
    "hint": "Modyfikuj x bezpośrednio: ++x.",
    "tests": [
      {
        "call": "([](){int x=3;zwieksz(x);return x;})()",
        "expected": "4"
      },
      {
        "call": "([](){int x=-1;zwieksz(x);return x;})()",
        "expected": "0"
      },
      {
        "call": "([](){int x=0;zwieksz(x);return x;})()",
        "expected": "1"
      },
      {
        "call": "([](){int x=99;zwieksz(x);return x;})()",
        "expected": "100"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 7,
    "id": "zamien-referencje",
    "title": "Zamień dwie wartości",
    "fn": "zamien",
    "description": "Zamień wartości dwóch zmiennych przez referencje.",
    "starter": "void zamien(int& a, int& b) {\n    // TODO\n}\n",
    "hint": "Użyj zmiennej pomocniczej albo swap(a,b).",
    "tests": [
      {
        "call": "([](){int a=1,b=9;zamien(a,b);return to_string(a)+\",\"+to_string(b);})()",
        "expected": "9,1"
      },
      {
        "call": "([](){int a=-3,b=4;zamien(a,b);return to_string(a)+\",\"+to_string(b);})()",
        "expected": "4,-3"
      },
      {
        "call": "([](){int a=5,b=5;zamien(a,b);return a;})()",
        "expected": "5"
      },
      {
        "call": "([](){int a=0,b=7;zamien(a,b);return b;})()",
        "expected": "0"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 7,
    "id": "wskaznik-wartosc",
    "title": "Odczyt wskaźnika",
    "fn": "odczytaj",
    "description": "Dla wskaźnika int* zwróć jego wartość albo 0 dla nullptr.",
    "starter": "int odczytaj(const int* p) {\n    return 0;\n}\n",
    "hint": "Przed użyciem *p sprawdź p != nullptr.",
    "tests": [
      {
        "call": "([](){int x=7;return odczytaj(&x);})()",
        "expected": "7"
      },
      {
        "call": "odczytaj(nullptr)",
        "expected": "0"
      },
      {
        "call": "([](){int x=-2;return odczytaj(&x);})()",
        "expected": "-2"
      },
      {
        "call": "([](){int x=0;return odczytaj(&x);})()",
        "expected": "0"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 7,
    "id": "podwoj-wskaznik",
    "title": "Modyfikuj wskaźnikiem",
    "fn": "podwoj",
    "description": "Podwój wartość pod wskazanym adresem; nullptr zignoruj.",
    "starter": "void podwoj(int* p) {\n    // TODO\n}\n",
    "hint": "Jeśli p != nullptr, wykonaj *p *= 2.",
    "tests": [
      {
        "call": "([](){int x=7;podwoj(&x);return x;})()",
        "expected": "14"
      },
      {
        "call": "([](){int x=-3;podwoj(&x);return x;})()",
        "expected": "-6"
      },
      {
        "call": "([](){int x=0;podwoj(&x);return x;})()",
        "expected": "0"
      },
      {
        "call": "([](){podwoj(nullptr);return 1;})()",
        "expected": "1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 7,
    "id": "tablica-wskaznik",
    "title": "Suma tablicy przez wskaźnik",
    "fn": "sumaTablicy",
    "description": "Policz sumę n elementów tablicy przekazanej jako const int*; dla n=0 zwróć 0.",
    "starter": "int sumaTablicy(const int* dane, int n) {\n    return 0;\n}\n",
    "hint": "Przechodź po *(dane+i) albo dane[i].",
    "tests": [
      {
        "call": "([](){int v[]={1,2,3};return sumaTablicy(v,3);})()",
        "expected": "6"
      },
      {
        "call": "([](){int v[]={-2,5};return sumaTablicy(v,2);})()",
        "expected": "3"
      },
      {
        "call": "sumaTablicy(nullptr,0)",
        "expected": "0"
      },
      {
        "call": "([](){int v[]={9};return sumaTablicy(v,1);})()",
        "expected": "9"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 7,
    "id": "zamien-wskazniki",
    "title": "Zamień wartości wskaźnikami",
    "fn": "zamienW",
    "description": "Zamień wartości dwóch liczb wskazywanych przez p i q; przy nullptr nic nie rób.",
    "starter": "void zamienW(int* p, int* q) {\n    // TODO\n}\n",
    "hint": "Sprawdź oba wskaźniki. Użyj zmiennej pomocniczej dla *p i *q.",
    "tests": [
      {
        "call": "([](){int a=2,b=3;zamienW(&a,&b);return to_string(a)+\",\"+to_string(b);})()",
        "expected": "3,2"
      },
      {
        "call": "([](){int a=-1,b=10;zamienW(&a,&b);return to_string(a)+\",\"+to_string(b);})()",
        "expected": "10,-1"
      },
      {
        "call": "([](){int a=5;zamienW(&a,nullptr);return a;})()",
        "expected": "5"
      },
      {
        "call": "([](){int a=7;zamienW(&a,&a);return a;})()",
        "expected": "7"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 8,
    "id": "student-punkty",
    "title": "Punkty studenta",
    "fn": "punktyStudenta",
    "description": "Zdefiniowano strukturę Student. Zwróć pole punkty.",
    "starter": "struct Student { string imie; int punkty; };\nint punktyStudenta(const Student& s) {\n    return 0;\n}\n",
    "hint": "Odczytaj s.punkty.",
    "tests": [
      {
        "call": "punktyStudenta(Student{\"Ola\",50})",
        "expected": "50"
      },
      {
        "call": "punktyStudenta(Student{\"Jan\",0})",
        "expected": "0"
      },
      {
        "call": "punktyStudenta(Student{\"A\",100})",
        "expected": "100"
      },
      {
        "call": "punktyStudenta(Student{\"B\",-5})",
        "expected": "-5"
      }
    ],
    "level": 1,
    "why": ""
  },
  {
    "module": 8,
    "id": "student-zaliczyl",
    "title": "Czy zaliczył?",
    "fn": "zaliczyl",
    "description": "Dla struktury Student zwróć true przy punktach >= 50.",
    "starter": "struct Student { string imie; int punkty; };\nbool zaliczyl(const Student& s) {\n    return false;\n}\n",
    "hint": "Porównaj s.punkty >= 50.",
    "tests": [
      {
        "call": "zaliczyl(Student{\"Ola\",50})",
        "expected": "1"
      },
      {
        "call": "zaliczyl(Student{\"Jan\",49})",
        "expected": "0"
      },
      {
        "call": "zaliczyl(Student{\"A\",80})",
        "expected": "1"
      },
      {
        "call": "zaliczyl(Student{\"B\",0})",
        "expected": "0"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 8,
    "id": "student-opis",
    "title": "Opis studenta",
    "fn": "opisStudenta",
    "description": "Zwróć tekst w formacie „Imie:punkty”.",
    "starter": "struct Student { string imie; int punkty; };\nstring opisStudenta(const Student& s) {\n    return \"\";\n}\n",
    "hint": "Połącz s.imie + \":\" + to_string(s.punkty).",
    "tests": [
      {
        "call": "opisStudenta(Student{\"Ola\",50})",
        "expected": "Ola:50"
      },
      {
        "call": "opisStudenta(Student{\"A\",0})",
        "expected": "A:0"
      },
      {
        "call": "opisStudenta(Student{\"Jan\",100})",
        "expected": "Jan:100"
      },
      {
        "call": "opisStudenta(Student{\"Iza\",-1})",
        "expected": "Iza:-1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 8,
    "id": "student-najlepszy",
    "title": "Najlepszy student",
    "fn": "najlepszy",
    "description": "Dla niepustego wektora Student zwróć imię pierwszej osoby z najwyższą liczbą punktów.",
    "starter": "struct Student { string imie; int punkty; };\nstring najlepszy(const vector<Student>& v) {\n    return \"\";\n}\n",
    "hint": "Śledź indeks najwyższej wartości punkty.",
    "tests": [
      {
        "call": "najlepszy(vector<Student>{{\"A\",10},{\"B\",20}})",
        "expected": "B"
      },
      {
        "call": "najlepszy(vector<Student>{{\"Iza\",99}})",
        "expected": "Iza"
      },
      {
        "call": "najlepszy(vector<Student>{{\"A\",5},{\"B\",5}})",
        "expected": "A"
      },
      {
        "call": "najlepszy(vector<Student>{{\"X\",-1},{\"Y\",0}})",
        "expected": "Y"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 8,
    "id": "produkt-wartosc",
    "title": "Wartość towaru",
    "fn": "wartoscProduktu",
    "description": "Oblicz cena*sztuk dla struktury Produkt.",
    "starter": "struct Produkt { string nazwa; double cena; int sztuk; };\ndouble wartoscProduktu(const Produkt& p) {\n    return 0;\n}\n",
    "hint": "Użyj p.cena * p.sztuk.",
    "tests": [
      {
        "call": "wartoscProduktu(Produkt{\"A\",2.5,4})",
        "expected": "10"
      },
      {
        "call": "wartoscProduktu(Produkt{\"B\",0.5,3})",
        "expected": "1.5"
      },
      {
        "call": "wartoscProduktu(Produkt{\"C\",10,0})",
        "expected": "0"
      },
      {
        "call": "wartoscProduktu(Produkt{\"D\",7,2})",
        "expected": "14"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 8,
    "id": "produkt-magazyn",
    "title": "Wartość magazynu",
    "fn": "wartoscMagazynu",
    "description": "Zwróć sumę wartości wszystkich Produktów w wektorze.",
    "starter": "struct Produkt { string nazwa; double cena; int sztuk; };\ndouble wartoscMagazynu(const vector<Produkt>& v) {\n    return 0;\n}\n",
    "hint": "Sumuj p.cena * p.sztuk dla każdego produktu.",
    "tests": [
      {
        "call": "wartoscMagazynu(vector<Produkt>{})",
        "expected": "0"
      },
      {
        "call": "wartoscMagazynu(vector<Produkt>{{\"A\",2,3}})",
        "expected": "6"
      },
      {
        "call": "wartoscMagazynu(vector<Produkt>{{\"A\",2,3},{\"B\",4,2}})",
        "expected": "14"
      },
      {
        "call": "wartoscMagazynu(vector<Produkt>{{\"C\",1.5,2},{\"D\",0.5,3}})",
        "expected": "4.5"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 9,
    "id": "strumien-suma",
    "title": "Suma liczb ze strumienia",
    "fn": "sumaZeStrumienia",
    "description": "Odczytaj wszystkie liczby całkowite ze strumienia i zwróć ich sumę.",
    "starter": "int sumaZeStrumienia(istream& in) {\n    return 0;\n}\n",
    "hint": "Użyj int x; while (in >> x) suma += x;",
    "tests": [
      {
        "call": "([](){istringstream in(\"1 2 3\");return sumaZeStrumienia(in);})()",
        "expected": "6"
      },
      {
        "call": "([](){istringstream in(\"\");return sumaZeStrumienia(in);})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\"-5 10\");return sumaZeStrumienia(in);})()",
        "expected": "5"
      },
      {
        "call": "([](){istringstream in(\"7\");return sumaZeStrumienia(in);})()",
        "expected": "7"
      }
    ],
    "level": 2,
    "why": "Tak samo można odczytać zawartość pliku przez ifstream; w testach używamy strumienia w pamięci."
  },
  {
    "module": 9,
    "id": "strumien-linie",
    "title": "Liczba linii",
    "fn": "liczLinie",
    "description": "Policz linie w strumieniu za pomocą getline.",
    "starter": "int liczLinie(istream& in) {\n    return 0;\n}\n",
    "hint": "while (getline(in, linia)) zwiększaj licznik.",
    "tests": [
      {
        "call": "([](){istringstream in(\"a\\nb\\n\");return liczLinie(in);})()",
        "expected": "2"
      },
      {
        "call": "([](){istringstream in(\"\");return liczLinie(in);})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\"abc\");return liczLinie(in);})()",
        "expected": "1"
      },
      {
        "call": "([](){istringstream in(\"1\\n2\\n3\");return liczLinie(in);})()",
        "expected": "3"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 9,
    "id": "strumien-nie-puste",
    "title": "Niepuste linie",
    "fn": "liczNiepuste",
    "description": "Policz linie zawierające przynajmniej jeden znak (sama spacja też liczy się jako znak).",
    "starter": "int liczNiepuste(istream& in) {\n    return 0;\n}\n",
    "hint": "Użyj getline; sprawdzaj !linia.empty().",
    "tests": [
      {
        "call": "([](){istringstream in(\"a\\n\\nb\");return liczNiepuste(in);})()",
        "expected": "2"
      },
      {
        "call": "([](){istringstream in(\"\\n\\n\");return liczNiepuste(in);})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\" \\n\");return liczNiepuste(in);})()",
        "expected": "1"
      },
      {
        "call": "([](){istringstream in(\"abc\");return liczNiepuste(in);})()",
        "expected": "1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 9,
    "id": "strumien-zapis",
    "title": "Zapisz liczby do strumienia",
    "fn": "zapiszLiczby",
    "description": "Zapisz liczby z wektora do ostream, oddzielając je przecinkami, bez przecinka na końcu.",
    "starter": "void zapiszLiczby(ostream& out, const vector<int>& v) {\n    // TODO\n}\n",
    "hint": "Przed elementem i>0 wypisz przecinek.",
    "tests": [
      {
        "call": "([](){ostringstream out;zapiszLiczby(out,vector<int>{1,2,3});return out.str();})()",
        "expected": "1,2,3"
      },
      {
        "call": "([](){ostringstream out;zapiszLiczby(out,vector<int>{});return out.str();})()",
        "expected": ""
      },
      {
        "call": "([](){ostringstream out;zapiszLiczby(out,vector<int>{7});return out.str();})()",
        "expected": "7"
      },
      {
        "call": "([](){ostringstream out;zapiszLiczby(out,vector<int>{-2,0});return out.str();})()",
        "expected": "-2,0"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 9,
    "id": "strumien-znajdz",
    "title": "Znajdź słowo w strumieniu",
    "fn": "czyZawiera",
    "description": "Zwróć true, jeśli strumień zawiera dokładnie wskazane słowo (operator >>).",
    "starter": "bool czyZawiera(istream& in, const string& cel) {\n    return false;\n}\n",
    "hint": "Odczytuj kolejne stringi i porównuj z cel.",
    "tests": [
      {
        "call": "([](){istringstream in(\"ala ma kota\");return czyZawiera(in,\"ma\");})()",
        "expected": "1"
      },
      {
        "call": "([](){istringstream in(\"ala ma kota\");return czyZawiera(in,\"Ma\");})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\"\");return czyZawiera(in,\"a\");})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\"abc abc\");return czyZawiera(in,\"abc\");})()",
        "expected": "1"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 9,
    "id": "strumien-srednia",
    "title": "Średnia liczb ze strumienia",
    "fn": "sredniaZeStrumienia",
    "description": "Zwróć średnią wszystkich liczb ze strumienia, dla pustego strumienia zwróć 0.",
    "starter": "double sredniaZeStrumienia(istream& in) {\n    return 0;\n}\n",
    "hint": "Zbieraj sumę i licznik; dziel sumę przez double(licznik).",
    "tests": [
      {
        "call": "([](){istringstream in(\"2 4 6\");return sredniaZeStrumienia(in);})()",
        "expected": "4"
      },
      {
        "call": "([](){istringstream in(\"1 2\");return sredniaZeStrumienia(in);})()",
        "expected": "1.5"
      },
      {
        "call": "([](){istringstream in(\"\");return sredniaZeStrumienia(in);})()",
        "expected": "0"
      },
      {
        "call": "([](){istringstream in(\"-2 2\");return sredniaZeStrumienia(in);})()",
        "expected": "0"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 10,
    "id": "wyszukiwanie-liniowe",
    "title": "Wyszukiwanie liniowe",
    "fn": "znajdz",
    "description": "Zwróć indeks pierwszego wystąpienia liczby x w wektorze, a jeśli jej nie ma -1.",
    "starter": "int znajdz(const vector<int>& v, int x) {\n    return -1;\n}\n",
    "hint": "Przeglądaj indeksy od 0 do v.size()-1.",
    "tests": [
      {
        "call": "znajdz(vector<int>{1,2,3},2)",
        "expected": "1"
      },
      {
        "call": "znajdz(vector<int>{2,2,3},2)",
        "expected": "0"
      },
      {
        "call": "znajdz(vector<int>{1,2,3},9)",
        "expected": "-1"
      },
      {
        "call": "znajdz(vector<int>{},1)",
        "expected": "-1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 10,
    "id": "binarne",
    "title": "Wyszukiwanie binarne",
    "fn": "szukajBinarnie",
    "description": "W posortowanym rosnąco wektorze sprawdź, czy istnieje element x.",
    "starter": "bool szukajBinarnie(const vector<int>& v, int x) {\n    return false;\n}\n",
    "hint": "Utrzymuj lewy i prawy indeks; sprawdzaj środek przedziału.",
    "tests": [
      {
        "call": "szukajBinarnie(vector<int>{1,3,5,7},5)",
        "expected": "1"
      },
      {
        "call": "szukajBinarnie(vector<int>{1,3,5,7},6)",
        "expected": "0"
      },
      {
        "call": "szukajBinarnie(vector<int>{},0)",
        "expected": "0"
      },
      {
        "call": "szukajBinarnie(vector<int>{2},2)",
        "expected": "1"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 10,
    "id": "sortowanie",
    "title": "Sortowanie rosnące",
    "fn": "sortuj",
    "description": "Zwróć kopię wektora posortowaną niemalejąco.",
    "starter": "vector<int> sortuj(vector<int> v) {\n    return v;\n}\n",
    "hint": "Użyj sort(v.begin(), v.end()) albo własnego algorytmu.",
    "tests": [
      {
        "call": "([](){auto v=sortuj({3,1,2});string s;for(int x:v)s+=to_string(x)+\",\";return s;})()",
        "expected": "1,2,3,"
      },
      {
        "call": "([](){auto v=sortuj({});return v.size();})()",
        "expected": "0"
      },
      {
        "call": "([](){auto v=sortuj({-1,5,0});string s;for(int x:v)s+=to_string(x)+\",\";return s;})()",
        "expected": "-1,0,5,"
      },
      {
        "call": "([](){auto v=sortuj({7,7});return v[0]+v[1];})()",
        "expected": "14"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 10,
    "id": "usun-duplikaty",
    "title": "Usuń duplikaty",
    "fn": "unikalne",
    "description": "Zwróć wektor zawierający tylko pierwsze wystąpienia każdej liczby, zachowując ich kolejność.",
    "starter": "vector<int> unikalne(const vector<int>& v) {\n    return {};\n}\n",
    "hint": "Zanim dodasz x do wyniku, sprawdź, czy już występuje.",
    "tests": [
      {
        "call": "([](){auto v=unikalne({1,2,1,3});string s;for(int x:v)s+=to_string(x)+\",\";return s;})()",
        "expected": "1,2,3,"
      },
      {
        "call": "([](){auto v=unikalne({});return v.size();})()",
        "expected": "0"
      },
      {
        "call": "([](){auto v=unikalne({7,7,7});return v.size();})()",
        "expected": "1"
      },
      {
        "call": "([](){auto v=unikalne({-1,0,-1});string s;for(int x:v)s+=to_string(x)+\",\";return s;})()",
        "expected": "-1,0,"
      }
    ],
    "level": 3,
    "why": ""
  },
  {
    "module": 10,
    "id": "rosnace",
    "title": "Czy tablica jest niemalejąca?",
    "fn": "niemalejacy",
    "description": "Sprawdź, czy każdy kolejny element wektora jest >= poprzedni.",
    "starter": "bool niemalejacy(const vector<int>& v) {\n    return false;\n}\n",
    "hint": "Jeśli znajdziesz v[i] < v[i-1], zwróć false.",
    "tests": [
      {
        "call": "niemalejacy(vector<int>{})",
        "expected": "1"
      },
      {
        "call": "niemalejacy(vector<int>{1,2,2,3})",
        "expected": "1"
      },
      {
        "call": "niemalejacy(vector<int>{1,3,2})",
        "expected": "0"
      },
      {
        "call": "niemalejacy(vector<int>{9})",
        "expected": "1"
      }
    ],
    "level": 2,
    "why": ""
  },
  {
    "module": 10,
    "id": "drugie-maks",
    "title": "Drugie różne maksimum",
    "fn": "drugieMaksimum",
    "description": "Zwróć drugą co do wielkości *różną* wartość niepustego wektora; gdy nie ma dwóch różnych liczb, zwróć -1.",
    "starter": "int drugieMaksimum(const vector<int>& v) {\n    return -1;\n}\n",
    "hint": "Możesz utworzyć kopię, posortować malejąco i znaleźć pierwszy element mniejszy od maksimum.",
    "tests": [
      {
        "call": "drugieMaksimum(vector<int>{1,7,3})",
        "expected": "3"
      },
      {
        "call": "drugieMaksimum(vector<int>{5,5,2})",
        "expected": "2"
      },
      {
        "call": "drugieMaksimum(vector<int>{4,4,4})",
        "expected": "-1"
      },
      {
        "call": "drugieMaksimum(vector<int>{1})",
        "expected": "-1"
      }
    ],
    "level": 3,
    "why": ""
  }
];

export const COURSE_PROGRESS_KEY = 'studylab-cpp-course-v1';
export const COURSE_CODE_PREFIX = 'studylab-cpp-course-code-v1:';

export function makeCourseHarness(source, exercise) {
  if (!exercise || /\b(?:int|auto|void)\s+main\s*\(/.test(source)) {
    throw new Error('W ćwiczeniu wpisz tylko wymaganą funkcję lub strukturę. StudyLab doda własny main() z testami.');
  }
  const prelude = '#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\n#include <algorithm>\n#include <cmath>\n#include <cctype>\n#include <numeric>\n#include <utility>\nusing namespace std;\n';
  const testCalls = exercise.tests.map((entry, index) => `  std::cout << "STUDYLAB_COURSE_${index}:" << (${entry.call}) << "\\n";`).join('\n');
  return `${prelude}\n${source}\nint main() {\n${testCalls}\n  return 0;\n}\n`;
}
export function readCourseResults(stdout, exercise) {
  const responses = new Map();
  for (const line of String(stdout || '').split(/\r?\n/)) {
    const match = line.trim().match(/^STUDYLAB_COURSE_(\d+):(.*)$/);
    if (match) responses.set(Number(match[1]), match[2]);
  }
  return exercise.tests.map((test, index) => ({
    label: `Przypadek ${index + 1}`, args: `Przypadek ${index + 1}`, expected: test.expected,
    received: responses.has(index) ? responses.get(index) : 'brak wyniku',
    pass: responses.get(index) === test.expected,
  }));
}
export function loadCourseProgress(storage) {
  try { const data = JSON.parse(storage.getItem(COURSE_PROGRESS_KEY) || '{}');
    return data && data.version === 1 && data.completed && typeof data.completed === 'object' ? data : { version:1, completed:{}, attempts:{} };
  } catch { return { version:1, completed:{}, attempts:{} }; }
}
export function updateCourseProgress(progress, taskId, passed) {
  const next = {
    version:1, completed:{ ...(progress.completed||{}) }, attempts:{ ...(progress.attempts||{}) },
  };
  next.attempts[taskId] = (next.attempts[taskId] || 0) + 1;
  if (passed && !next.completed[taskId]) next.completed[taskId] = new Date().toISOString();
  return next;
}
