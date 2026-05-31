#include <iostream>
#include <string>
#include "lib/json.hpp"

using namespace std;
using json = nlohmann::json;

int main() {
    string line;

    while (getline(cin, line)) {
        json state = json::parse(line);

		cout << "CALL\n";
		
		
        cout.flush();
    }
}
