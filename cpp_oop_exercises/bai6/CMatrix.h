#ifndef CMATRIX_H
#define CMATRIX_H

#include <cstddef>
#include <iosfwd>
#include <vector>
#include "CVector.h"

using namespace std;

class CMatrix {
public:
    CMatrix();
    CMatrix(size_t rows, size_t cols);

    size_t rows() const;
    size_t cols() const;

    double& at(size_t row, size_t col);
    const double& at(size_t row, size_t col) const;

    CMatrix operator+(const CMatrix& other) const;
    CMatrix operator-(const CMatrix& other) const;
    CVector operator*(const CVector& vec) const;
    CMatrix operator*(const CMatrix& other) const;

    friend ostream& operator<<(ostream& os, const CMatrix& matrix);
    friend istream& operator>>(istream& is, CMatrix& matrix);

private:
    size_t rows_;
    size_t cols_;
    vector<double> data_;
};

#endif
