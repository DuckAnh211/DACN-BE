#ifndef CTIME_H
#define CTIME_H

#include <iosfwd>

using namespace std;

class CTime {
public:
    CTime();
    CTime(int gio, int phut, int giay);

    int gio() const;
    int phut() const;
    int giay() const;

    CTime operator+(int giay) const;
    CTime operator-(int giay) const;

    CTime& operator++();
    CTime operator++(int);
    CTime& operator--();
    CTime operator--(int);

    double angleWithMinuteHand() const;

    friend ostream& operator<<(ostream& luongRa, const CTime& thoiGian);
    friend istream& operator>>(istream& luongVao, CTime& thoiGian);

private:
    static constexpr int kGiayMoiNgay = 24 * 60 * 60;
    int tongGiay_;

    static int chuanHoaGiay(int tongGiay);
};

#endif
