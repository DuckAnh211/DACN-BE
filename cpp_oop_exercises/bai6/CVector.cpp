#include "CVector.h"
#include <istream>
#include <ostream>
#include <stdexcept>

using namespace std;

CVector::CVector() = default;

CVector::CVector(size_t size) : values_(size, 0.0) {}

CVector::CVector(const vector<double>& values) : values_(values) {}

size_t CVector::size() const {
    return values_.size();
}

double& CVector::operator[](size_t index) {
    return values_.at(index);
}

const double& CVector::operator[](size_t index) const {
    return values_.at(index);
}

CVector CVector::operator+(const CVector& other) const {
    if (size() != other.size()) {
        throw invalid_argument("Vector dimensions do not match for addition");
    }

    CVector result(size());
    for (size_t i = 0; i < size(); ++i) {
        result.values_[i] = values_[i] + other.values_[i];
    }
    return result;
}

CVector CVector::operator-(const CVector& other) const {
    if (size() != other.size()) {
        throw invalid_argument("Vector dimensions do not match for subtraction");
    }

    CVector result(size());
    for (size_t i = 0; i < size(); ++i) {
        result.values_[i] = values_[i] - other.values_[i];
    }
    return result;
}

double CVector::dot(const CVector& other) const {
    if (size() != other.size()) {
        throw invalid_argument("Vector dimensions do not match for dot product");
    }

    double sum = 0.0;
    for (size_t i = 0; i < size(); ++i) {
        sum += values_[i] * other.values_[i];
    }
    return sum;
}

ostream& operator<<(ostream& os, const CVector& vec) {
    os << "[";
    for (size_t i = 0; i < vec.values_.size(); ++i) {
        os << vec.values_[i];
        if (i + 1 < vec.values_.size()) {
            os << " ";
        }
    }
    os << "]";
    return os;
}

istream& operator>>(istream& is, CVector& vec) {
    size_t n = 0;
    is >> n;
    if (!is) {
        return is;
    }

    vec = CVector(n);
    for (size_t i = 0; i < n; ++i) {
        is >> vec.values_[i];
        if (!is) {
            return is;
        }
    }
    return is;
}
