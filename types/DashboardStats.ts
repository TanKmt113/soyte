export interface DashboardStats {
    overview: {
        total: number;
        pending: number;
        accepted: number;
        averageRating: number;
    };
    phuluc: {
        tiendo: {
            daLam: number;
            dangLam: number;
            chuaLam: number;
        };
        danhgia: {
            dat: number;
            khongDat: number;
        };
    };
    bieumau: {
        ratingDistribution: {
            star5: number;
            star4: number;
            star3: number;
            star2: number;
            star1: number;
            star0: number;
        };
    };
    trend: Array<{ date: string; count: number }>;
}