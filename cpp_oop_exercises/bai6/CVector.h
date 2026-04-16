#ifndef CVECTOR_H
#define CVECTOR_H

#include <cstddef>
#include <iosfwd>
#include <vector>

using namespace std;

class CVector {
public:
    CVector();
    explicit CVector(size_t size);
    explicit CVector(const vector<double>& values);

    size_t size() const;
    double& operator[](size_t index);
    const double& operator[](size_t index) const;

    CVector operator+(const CVector& other) const;
    CVector operator-(const CVector& other) const;
    double dot(const CVector& other) const;

    friend ostream& operator<<(ostream& os, const CVector& vec);
    friend istream& operator>>(istream& is, CVector& vec);

private:
    vector<double> values_;
};

#endif
