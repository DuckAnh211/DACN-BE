#include <iostream>
#include "DaThuc.h"

using namespace std;

int main() {
    CPolynomial daThucP;
    CPolynomial daThucQ;
    double giaTriX = 0.0;

    cout << "Nhap da thuc P theo dang: n a_n ... a_0\n";
    cin >> daThucP;
    cout << "Nhap da thuc Q theo dang: n a_n ... a_0\n";
    cin >> daThucQ;

    cout << "P(x) = " << daThucP << '\n';
    cout << "Q(x) = " << daThucQ << '\n';
    cout << "P + Q = " << (daThucP + daThucQ) << '\n';
    cout << "P - Q = " << (daThucP - daThucQ) << '\n';
    cout << "P * Q = " << (daThucP * daThucQ) << '\n';

    cout << "Nhap gia tri x de tinh P(x): ";
    cin >> giaTriX;
    cout << "P(" << giaTriX << ") = " << daThucP.evaluate(giaTriX) << '\n';

    return 0;
}
