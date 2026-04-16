#include "CTime.h"
#include <cmath>
#include <iomanip>
#include <istream>
#include <ostream>

using namespace std;

CTime::CTime() : tongGiay_(0) {}

CTime::CTime(int gio, int phut, int giay)
    : tongGiay_(chuanHoaGiay(gio * 3600 + phut * 60 + giay)) {}

int CTime::gio() const {
    return tongGiay_ / 3600;
}

int CTime::phut() const {
    return (tongGiay_ % 3600) / 60;
}

int CTime::giay() const {
    return tongGiay_ % 60;
}

CTime CTime::operator+(int giay) const {
    return CTime(0, 0, tongGiay_ + giay);
}

CTime CTime::operator-(int giay) const {
    return CTime(0, 0, tongGiay_ - giay);
}

CTime& CTime::operator++() {
    tongGiay_ = chuanHoaGiay(tongGiay_ + 1);
    return *this;
}

CTime CTime::operator++(int) {
    CTime cu = *this;
    ++(*this);
    return cu;
}

CTime& CTime::operator--() {
    tongGiay_ = chuanHoaGiay(tongGiay_ - 1);
    return *this;
}

CTime CTime::operator--(int) {
    CTime cu = *this;
    --(*this);
    return cu;
}

double CTime::angleWithMinuteHand() const {
    const double gocGio = (gio() % 12) * 30.0 + phut() * 0.5 + giay() * (0.5 / 60.0);
    const double gocPhut = phut() * 6.0 + giay() * 0.1;
    double chenhLech = fabs(gocGio - gocPhut);
    if (chenhLech > 180.0) {
        chenhLech = 360.0 - chenhLech;
    }
    return chenhLech;
}

ostream& operator<<(ostream& luongRa, const CTime& thoiGian) {
    luongRa << setfill('0')
       << setw(2) << thoiGian.gio() << ':'
       << setw(2) << thoiGian.phut() << ':'
       << setw(2) << thoiGian.giay()
       << setfill(' ');
    return luongRa;
}

istream& operator>>(istream& luongVao, CTime& thoiGian) {
    int gio = 0;
    int phut = 0;
    int giay = 0;
    luongVao >> gio >> phut >> giay;
    if (luongVao) {
        thoiGian = CTime(gio, phut, giay);
    }
    return luongVao;
}

int CTime::chuanHoaGiay(int tongGiay) {
    int ketQua = tongGiay % kGiayMoiNgay;
    if (ketQua < 0) {
        ketQua += kGiayMoiNgay;
    }
    return ketQua;
}
