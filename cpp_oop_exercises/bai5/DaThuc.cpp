#include "DaThuc.h"
#include <algorithm>
#include <cmath>
#include <istream>
#include <ostream>

using namespace std;

namespace {
constexpr double kEps = 1e-12;
}

CPolynomial::CPolynomial() : heSo_(1, 0.0) {}

CPolynomial::CPolynomial(const vector<double>& heSo) : heSo_(heSo) {
    if (heSo_.empty()) {
        heSo_.push_back(0.0);
    }
    trim();
}

int CPolynomial::degree() const {
    return static_cast<int>(heSo_.size()) - 1;
}

double CPolynomial::evaluate(double giaTriX) const {
    double ketQua = 0.0;
    for (int bac = degree(); bac >= 0; --bac) {
        ketQua = ketQua * giaTriX + heSo_[bac];
    }
    return ketQua;
}

CPolynomial CPolynomial::operator+(const CPolynomial& daThucKhac) const {
    const size_t kichThuocLonNhat = max(heSo_.size(), daThucKhac.heSo_.size());
    vector<double> ketQua(kichThuocLonNhat, 0.0);

    for (size_t chiSo = 0; chiSo < kichThuocLonNhat; ++chiSo) {
        const double heSoA = (chiSo < heSo_.size()) ? heSo_[chiSo] : 0.0;
        const double heSoB = (chiSo < daThucKhac.heSo_.size()) ? daThucKhac.heSo_[chiSo] : 0.0;
        ketQua[chiSo] = heSoA + heSoB;
    }

    return CPolynomial(ketQua);
}

CPolynomial CPolynomial::operator-(const CPolynomial& daThucKhac) const {
    const size_t kichThuocLonNhat = max(heSo_.size(), daThucKhac.heSo_.size());
    vector<double> ketQua(kichThuocLonNhat, 0.0);

    for (size_t chiSo = 0; chiSo < kichThuocLonNhat; ++chiSo) {
        const double heSoA = (chiSo < heSo_.size()) ? heSo_[chiSo] : 0.0;
        const double heSoB = (chiSo < daThucKhac.heSo_.size()) ? daThucKhac.heSo_[chiSo] : 0.0;
        ketQua[chiSo] = heSoA - heSoB;
    }

    return CPolynomial(ketQua);
}

CPolynomial CPolynomial::operator*(const CPolynomial& daThucKhac) const {
    vector<double> ketQua(heSo_.size() + daThucKhac.heSo_.size() - 1, 0.0);
    for (size_t i = 0; i < heSo_.size(); ++i) {
        for (size_t j = 0; j < daThucKhac.heSo_.size(); ++j) {
            ketQua[i + j] += heSo_[i] * daThucKhac.heSo_[j];
        }
    }
    return CPolynomial(ketQua);
}

ostream& operator<<(ostream& luongRa, const CPolynomial& daThuc) {
    bool laHangDau = true;
    for (int bac = daThuc.degree(); bac >= 0; --bac) {
        const double heSo = daThuc.heSo_[bac];
        if (fabs(heSo) < kEps) {
            continue;
        }

        if (!laHangDau) {
            luongRa << (heSo >= 0 ? " + " : " - ");
        } else if (heSo < 0) {
            luongRa << "-";
        }

        const double triTuyetDoi = fabs(heSo);
        if (!(fabs(triTuyetDoi - 1.0) < kEps && bac > 0)) {
            luongRa << triTuyetDoi;
            if (bac > 0) {
                luongRa << "*";
            }
        }

        if (bac > 0) {
            luongRa << "x";
            if (bac > 1) {
                luongRa << "^" << bac;
            }
        }

        laHangDau = false;
    }

    if (laHangDau) {
        luongRa << "0";
    }

    return luongRa;
}

istream& operator>>(istream& luongVao, CPolynomial& daThuc) {
    int bac = 0;
    luongVao >> bac;
    if (!luongVao || bac < 0) {
        luongVao.setstate(ios::failbit);
        return luongVao;
    }

    vector<double> heSoTangDan(static_cast<size_t>(bac) + 1, 0.0);
    for (int soMu = bac; soMu >= 0; --soMu) {
        double heSo = 0.0;
        luongVao >> heSo;
        if (!luongVao) {
            return luongVao;
        }
        heSoTangDan[soMu] = heSo;
    }

    daThuc = CPolynomial(heSoTangDan);
    return luongVao;
}

void CPolynomial::trim() {
    while (heSo_.size() > 1 && fabs(heSo_.back()) < kEps) {
        heSo_.pop_back();
    }
}
