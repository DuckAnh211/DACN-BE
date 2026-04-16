#include <iostream>
#include <stdexcept>
#include "CMatrix.h"
#include "CVector.h"

using namespace std;

int main() {
    CMatrix a;
    CMatrix b;
    CVector v;

    cout << "Nhap ma tran A theo dang: rows cols ...phan tu...\n";
    cin >> a;
    cout << "Nhap vector v theo dang: n ...phan tu...\n";
    cin >> v;
    cout << "Nhap ma tran B theo dang: rows cols ...phan tu...\n";
    cin >> b;

    try {
        CVector av = a * v;
        cout << "A * v = " << av << '\n';
    } catch (const invalid_argument& ex) {
        cout << "Khong the tinh A * v: " << ex.what() << '\n';
    }

    try {
        CMatrix ab = a * b;
        cout << "A * B =\n" << ab << '\n';
    } catch (const invalid_argument& ex) {
        cout << "Khong the tinh A * B: " << ex.what() << '\n';
    }

    return 0;
}
