#include <iomanip>
#include <iostream>
#include "CTime.h"

using namespace std;

int main() {
    CTime tg;
    cout << "Nhap gio phut giay (hh mm ss): ";
    cin >> tg;

    cout << "Gia lap dong ho o goc tren phai man hinh:\n";
    cout << setw(50) << tg << '\n';

    cout << "Goc giua kim gio va kim phut: " << tg.angleWithMinuteHand() << " do\n";
    cout << "Sau ++tg: " << ++tg << '\n';
    cout << "tg + 125 giay: " << (tg + 125) << '\n';
    cout << "tg - 300 giay: " << (tg - 300) << '\n';

    return 0;
}
