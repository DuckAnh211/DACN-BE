#include <cmath>
#include <iostream>
#include "CDate.h"

using namespace std;

int main() {
    CDate openDate;
    CDate closeDate;
    double principal = 0.0;
    double annualRate = 0.0;

    cout << "Nhap ngay gui (dd mm yyyy): ";
    cin >> openDate;
    cout << "Nhap ngay rut (dd mm yyyy): ";
    cin >> closeDate;
    cout << "Nhap so tien gui ban dau: ";
    cin >> principal;
    cout << "Nhap lai suat nam (%): ";
    cin >> annualRate;

    long long days = closeDate - openDate;
    if (days < 0) {
        days = llabs(days);
    }

    const double interest = principal * (annualRate / 100.0) * (static_cast<double>(days) / 365.0);
    const double total = principal + interest;

    cout << "So ngay gui: " << days << '\n';
    cout << "Tien lai don: " << interest << '\n';
    cout << "Tong tien nhan duoc: " << total << '\n';

    return 0;
}
