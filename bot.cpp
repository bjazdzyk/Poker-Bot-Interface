#include <iostream>
#include <string>
#include "lib/json.hpp"

using namespace std;
using json = nlohmann::json;

int main() {
    string line;

    while (getline(cin, line)) {
        json state = json::parse(line);

        int balance = state["balance"];
        int to_call = state["to_call"];
        auto hand = state["hand"];

        string c1 = hand[0][0];
        string c2 = hand[1][0];

        // bardzo prosta heurystyka "czy warto grać"
        bool strong_pair =
            (c1 == c2) || 
            (c1 == "A" || c2 == "A");

        // jeśli koszt wejścia jest za duży → fold
        if (to_call > balance * 0.5) {
            cout << "FOLD\n";
        }
        // mocna ręka → raise
        else if (strong_pair) {
            int raise = min(balance / 4, 50);
            cout << "RAISE " << raise << "\n";
        }
        // inaczej call
        else {
            cout << "CALL\n";
        }

        cout.flush();
    }
}

