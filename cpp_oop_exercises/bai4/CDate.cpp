#include "CDate.h"
#include <iomanip>
#include <istream>
#include <ostream>
#include <stdexcept>

using namespace std;

CDate::CDate() : day_(1), month_(1), year_(1970) {}

CDate::CDate(int day, int month, int year) : day_(day), month_(month), year_(year) {
    validate();
}

int CDate::day() const {
    return day_;
}

int CDate::month() const {
    return month_;
}

int CDate::year() const {
    return year_;
}

CDate CDate::operator+(int days) const {
    const long long serial = toSerial(day_, month_, year_) + days;
    int d = 1;
    int m = 1;
    int y = 1970;
    fromSerial(serial, d, m, y);
    return CDate(d, m, y);
}

CDate CDate::operator-(int days) const {
    return (*this) + (-days);
}

long long CDate::operator-(const CDate& other) const {
    return toSerial(day_, month_, year_) - toSerial(other.day_, other.month_, other.year_);
}

CDate& CDate::operator++() {
    *this = *this + 1;
    return *this;
}

CDate CDate::operator++(int) {
    CDate old = *this;
    ++(*this);
    return old;
}

CDate& CDate::operator--() {
    *this = *this - 1;
    return *this;
}

CDate CDate::operator--(int) {
    CDate old = *this;
    --(*this);
    return old;
}

ostream& operator<<(ostream& os, const CDate& date) {
    os << setfill('0')
       << setw(2) << date.day_ << '/'
       << setw(2) << date.month_ << '/'
       << setw(4) << date.year_
       << setfill(' ');
    return os;
}

istream& operator>>(istream& is, CDate& date) {
    int d = 0;
    int m = 0;
    int y = 0;
    is >> d >> m >> y;
    if (!is) {
        return is;
    }

    try {
        date = CDate(d, m, y);
    } catch (const invalid_argument&) {
        is.setstate(ios::failbit);
    }

    return is;
}

bool CDate::isLeapYear(int year) {
    return (year % 400 == 0) || (year % 4 == 0 && year % 100 != 0);
}

int CDate::daysInMonth(int month, int year) {
    static const int monthDays[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
    if (month == 2 && isLeapYear(year)) {
        return 29;
    }
    return monthDays[month - 1];
}

long long CDate::toSerial(int day, int month, int year) {
    int y = year;
    int m = month;
    y -= m <= 2;
    const long long era = (y >= 0 ? y : y - 399) / 400;
    const unsigned yoe = static_cast<unsigned>(y - era * 400);
    const unsigned doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + static_cast<unsigned>(day) - 1;
    const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    return era * 146097 + static_cast<long long>(doe) - 719468;
}

void CDate::fromSerial(long long serial, int& day, int& month, int& year) {
    long long z = serial + 719468;
    const long long era = (z >= 0 ? z : z - 146096) / 146097;
    const unsigned doe = static_cast<unsigned>(z - era * 146097);
    const unsigned yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    long long y = static_cast<long long>(yoe) + era * 400;
    const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    const unsigned mp = (5 * doy + 2) / 153;

    day = static_cast<int>(doy - (153 * mp + 2) / 5 + 1);
    month = static_cast<int>(mp + (mp < 10 ? 3 : -9));
    y += (month <= 2);
    year = static_cast<int>(y);
}

void CDate::validate() const {
    if (month_ < 1 || month_ > 12) {
        throw invalid_argument("Month must be in [1, 12]");
    }
    if (day_ < 1 || day_ > daysInMonth(month_, year_)) {
        throw invalid_argument("Invalid day for month/year");
    }
}
