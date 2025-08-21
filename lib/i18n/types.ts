export type Language = 'en' | 'sv'

export interface TranslationKey {
    en: string
    sv: string
}

export interface Translations {
    // Navigation
    nav: {
        logisticsGame: TranslationKey
        reportBug: TranslationKey
        logOut: TranslationKey
        backToDashboard: TranslationKey
    }

    // Dashboard
    dashboard: {
        welcome: TranslationKey
        student: TranslationKey
        teacher: TranslationKey
        groups: TranslationKey
        students: TranslationKey
    }

    // Performance
    performance: {
        levelOverview: TranslationKey
        aggregateStatistics: TranslationKey
        totalGroups: TranslationKey
        groupsWhoPlayed: TranslationKey
        completedLevel: TranslationKey
        averageScore: TranslationKey
        participation: TranslationKey
        completionRate: TranslationKey
        profitStatistics: TranslationKey
        averageProfit: TranslationKey
        bestPerformance: TranslationKey
        by: TranslationKey
        groupAccess: TranslationKey
        viewIndividualPerformance: TranslationKey
        selectGroupToView: TranslationKey
        selectGroup: TranslationKey
        searchGroup: TranslationKey
        noGroupFound: TranslationKey
        groupPerformanceList: TranslationKey
        group: TranslationKey
        status: TranslationKey
        score: TranslationKey
        profit: TranslationKey
        daysPlayed: TranslationKey
        completed: TranslationKey
        played: TranslationKey
        notStarted: TranslationKey
        groupPerformanceAnalytics: TranslationKey
        level: TranslationKey
        noPerformanceData: TranslationKey
        hasntCompletedGameplay: TranslationKey
        performanceSummary: TranslationKey
        yourPerformanceSummary: TranslationKey
        totalProfit: TranslationKey
        completion: TranslationKey
        dailyProgress: TranslationKey
        noProgressYet: TranslationKey
        trackDailyPerformance: TranslationKey
        analyzingProgress: TranslationKey
    }

    // Game
    game: {
        theFirstSpark: TranslationKey
        timingIsEverything: TranslationKey
        forecastTheFuture: TranslationKey
        uncertaintyUnleashed: TranslationKey
        day: TranslationKey
        cash: TranslationKey
        revenue: TranslationKey
        costs: TranslationKey
        cumulativeProfit: TranslationKey
        production: TranslationKey
        sales: TranslationKey
    }

    // Common
    common: {
        loading: TranslationKey
        error: TranslationKey
        cancel: TranslationKey
        save: TranslationKey
        edit: TranslationKey
        delete: TranslationKey
        close: TranslationKey
        yes: TranslationKey
        no: TranslationKey
        english: TranslationKey
        swedish: TranslationKey
    }
}
