#ifndef DATHUC_H
#define DATHUC_H

#include <iosfwd>
#include <vector>

using namespace std;

class CPolynomial {
public:
    CPolynomial();
    explicit CPolynomial(const vector<double>& heSo);

    int degree() const;
    double evaluate(double giaTriX) const;

    CPolynomial operator+(const CPolynomial& daThucKhac) const;
    CPolynomial operator-(const CPolynomial& daThucKhac) const;
    CPolynomial operator*(const CPolynomial& daThucKhac) const;

    friend ostream& operator<<(ostream& luongRa, const CPolynomial& daThuc);
    friend istream& operator>>(istream& luongVao, CPolynomial& daThuc);

private:
    vector<double> heSo_;

    void trim();
};

#endif
