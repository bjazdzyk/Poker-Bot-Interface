# Dokumentacja protokołu komunikacji stolik → bot pokerowy

Podczas każdej tury stolik wysyła do bota pojedynczy obiekt JSON opisujący aktualny stan gry. Bot powinien na jego podstawie podjąć decyzję i zwrócić jedną z akcji:

* `CALL`
* `RAISE <kwota>`
* `FOLD` (lub dowolny inny tekst niebędący `CALL` ani `RAISE`, co zostanie potraktowane jako fold)

## Przykładowy JSON

```json
{
  "id": 1,
  "number_of_players": 3,
  "balance": 480,
  "dealer_id": 0,
  "pot": 30,
  "to_call": 20,
  "stage": "preflop",
  "called": [0, 10, 20],
  "in_game": [1, 1, 1],
  "all_in": [0, 0, 0],
  "hand": [
    ["A", "pik"],
    ["K", "pik"]
  ],
  "hand_id": [51, 47],
  "table": [
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1],
    [-1, -1]
  ]
}
```

---

# Pola obiektu

## id

Identyfikator gracza (bota), który otrzymuje wiadomość.

Typ:

```json
number
```

Przykład:

```json
"id": 2
```

---

## number_of_players

Liczba graczy uczestniczących w rozgrywce.

Typ:

```json
number
```

Przykład:

```json
"number_of_players": 3
```

---

## balance

Aktualny stan żetonów gracza.

Typ:

```json
number
```

Przykład:

```json
"balance": 450
```

---

## dealer_id

Identyfikator aktualnego dealera.

Typ:

```json
number
```

Przykład:

```json
"dealer_id": 0
```

---

## pot

Aktualna wartość puli.

Typ:

```json
number
```

Przykład:

```json
"pot": 120
```

---

## to_call

Kwota potrzebna do wyrównania najwyższego zakładu.

Typ:

```json
number
```

Przykład:

```json
"to_call": 30
```

Jeżeli wartość wynosi `0`, gracz może przeczekać poprzez wysłanie:

```text
CALL
```

---

## stage

Aktualna faza rozdania.

Typ:

```json
string
```

Możliwe wartości:

| Wartość     | Opis                                          |
| ----------- | --------------------------------------------- |
| `"preflop"` | Przed wyłożeniem kart wspólnych               |
| `"flop"`    | Po wyłożeniu pierwszych trzech kart wspólnych |
| `"turn"`    | Po wyłożeniu czwartej karty wspólnej          |
| `"river"`   | Po wyłożeniu piątej karty wspólnej            |

---

## called

Tablica zawierająca sumę żetonów wpłaconych przez każdego gracza w bieżącej rundzie licytacji.

Typ:

```json
number[]
```

Przykład:

```json
"called": [20, 20, 40]
```

Interpretacja:

* Gracz 0 wpłacił 20
* Gracz 1 wpłacił 20
* Gracz 2 wpłacił 40

---

## in_game

Informacja, czy dany gracz nadal uczestniczy w rozdaniu.

Typ:

```json
number[]
```

Wartości:

* `1` – gracz aktywny
* `0` – gracz spasował

Przykład:

```json
"in_game": [1, 0, 1]
```

---

## all_in

Informacja, czy dany gracz jest all-in.

Typ:

```json
number[]
```

Wartości:

* `1` – gracz jest all-in
* `0` – gracz nadal posiada żetony

Przykład:

```json
"all_in": [0, 1, 0]
```

---

## hand

Dwie prywatne karty gracza.

Typ:

```json
string[][]
```

Przykład:

```json
"hand": [
  ["A", "pik"],
  ["K", "pik"]
]
```

Format pojedynczej karty:

```json
[figura, kolor]
```

### Figury

```text
2, 3, 4, 5, 6, 7, 8, 9, 10, J, D, K, A
```

### Kolory

```text
kier
karo
trefl
pik
```

---

## hand_id

Numery identyfikacyjne kart prywatnych.

Typ:

```json
number[]
```

Przykład:

```json
"hand_id": [51, 47]
```

Zakres identyfikatorów:

```text
0 - 51
```

Każda karta w talii posiada unikalny identyfikator.

---

## table

Aktualnie widoczne karty wspólne.

Typ:

```json
array[5]
```

Przykład podczas flopa:

```json
"table": [
  ["A", "kier"],
  ["10", "trefl"],
  ["7", "pik"],
  [-1, -1],
  [-1, -1]
]
```

Znaczenie pozycji:

| Indeks | Karta  |
| ------ | ------ |
| 0      | Flop 1 |
| 1      | Flop 2 |
| 2      | Flop 3 |
| 3      | Turn   |
| 4      | River  |

Jeżeli karta nie została jeszcze odkryta, jej wartość wynosi:

```json
[-1, -1]
```

---

# Odpowiedzi bota

## Call

Wyrównanie aktualnego zakładu:

```text
CALL
```

---

## Raise

Podbicie stawki:

```text
RAISE 50
```

Liczba oznacza wielkość podbicia.

---

## Fold

Spasowanie:

```text
FOLD
```

Każda odpowiedź inna niż `CALL` lub `RAISE <kwota>` zostanie potraktowana jako fold.
