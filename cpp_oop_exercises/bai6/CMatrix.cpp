#include "CMatrix.h"
#include <istream>
#include <ostream>
#include <stdexcept>

using namespace std;

CMatrix::CMatrix() : rows_(0), cols_(0) {}

CMatrix::CMatrix(size_t rows, size_t cols)
    : rows_(rows), cols_(cols), data_(rows * cols, 0.0) {}

size_t CMatrix::rows() const {
    return rows_;
}

size_t CMatrix::cols() const {
    return cols_;
}

double& CMatrix::at(size_t row, size_t col) {
    if (row >= rows_ || col >= cols_) {
        throw out_of_range("Matrix index out of range");
    }
    return data_[row * cols_ + col];
}

const double& CMatrix::at(size_t row, size_t col) const {
    if (row >= rows_ || col >= cols_) {
        throw out_of_range("Matrix index out of range");
    }
    return data_[row * cols_ + col];
}

CMatrix CMatrix::operator+(const CMatrix& other) const {
    if (rows_ != other.rows_ || cols_ != other.cols_) {
        throw invalid_argument("Matrix dimensions do not match for addition");
    }

    CMatrix result(rows_, cols_);
    for (size_t i = 0; i < data_.size(); ++i) {
        result.data_[i] = data_[i] + other.data_[i];
    }
    return result;
}

CMatrix CMatrix::operator-(const CMatrix& other) const {
    if (rows_ != other.rows_ || cols_ != other.cols_) {
        throw invalid_argument("Matrix dimensions do not match for subtraction");
    }

    CMatrix result(rows_, cols_);
    for (size_t i = 0; i < data_.size(); ++i) {
        result.data_[i] = data_[i] - other.data_[i];
    }
    return result;
}

CVector CMatrix::operator*(const CVector& vec) const {
    if (cols_ != vec.size()) {
        throw invalid_argument("Matrix columns must equal vector dimension");
    }

    CVector result(rows_);
    for (size_t r = 0; r < rows_; ++r) {
        double sum = 0.0;
        for (size_t c = 0; c < cols_; ++c) {
            sum += at(r, c) * vec[c];
        }
        result[r] = sum;
    }
    return result;
}

CMatrix CMatrix::operator*(const CMatrix& other) const {
    if (cols_ != other.rows_) {
        throw invalid_argument("Matrix dimensions are invalid for multiplication");
    }

    CMatrix result(rows_, other.cols_);
    for (size_t r = 0; r < rows_; ++r) {
        for (size_t c = 0; c < other.cols_; ++c) {
            double sum = 0.0;
            for (size_t k = 0; k < cols_; ++k) {
                sum += at(r, k) * other.at(k, c);
            }
            result.at(r, c) = sum;
        }
    }
    return result;
}

ostream& operator<<(ostream& os, const CMatrix& matrix) {
    for (size_t r = 0; r < matrix.rows_; ++r) {
        os << "[";
        for (size_t c = 0; c < matrix.cols_; ++c) {
            os << matrix.at(r, c);
            if (c + 1 < matrix.cols_) {
                os << " ";
            }
        }
        os << "]";
        if (r + 1 < matrix.rows_) {
            os << '\n';
        }
    }
    return os;
}

istream& operator>>(istream& is, CMatrix& matrix) {
    size_t rows = 0;
    size_t cols = 0;
    is >> rows >> cols;
    if (!is) {
        return is;
    }

    matrix = CMatrix(rows, cols);
    for (size_t r = 0; r < rows; ++r) {
        for (size_t c = 0; c < cols; ++c) {
            is >> matrix.at(r, c);
            if (!is) {
                return is;
            }
        }
    }

    return is;
}
