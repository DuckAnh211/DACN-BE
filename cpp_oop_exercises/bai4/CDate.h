#ifndef CDATE_H
#define CDATE_H

#include <iosfwd>

using namespace std;

class CDate {
public:
    CDate();
    CDate(int day, int month, int year);

    int day() const;
    int month() const;
    int year() const;

    CDate operator+(int days) const;
    CDate operator-(int days) const;
    long long operator-(const CDate& other) const;

    CDate& operator++();
    CDate operator++(int);
    CDate& operator--();
    CDate operator--(int);

    friend ostream& operator<<(ostream& os, const CDate& date);
    friend istream& operator>>(istream& is, CDate& date);

private:
    int day_;
    int month_;
    int year_;

    static bool isLeapYear(int year);
    static int daysInMonth(int month, int year);
    static long long toSerial(int day, int month, int year);
    static void fromSerial(long long serial, int& day, int& month, int& year);
    void validate() const;
};

#endif
