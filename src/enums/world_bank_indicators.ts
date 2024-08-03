export enum WorldBankIndicators {
    Population = 'SP.POP.TOTL',
    PopulationGrowth = 'SP.POP.GROW',
    LifeExpectancy = 'SP.DYN.LE00.IN',
    AdultLiteracyRate = 'SE.ADT.LITR.ZS',
    CO2Emissions = 'EN.ATM.CO2E.PC',
    ForestArea = 'AG.LND.FRST.ZS',
    AccessToElectricity = 'EG.ELC.ACCS.ZS',
    UnemploymentRate = 'SL.UEM.TOTL.ZS',
    GDP = 'NY.GDP.MKTP.CD',
    GDPPerCapita = 'NY.GDP.PCAP.CD',
    GDPGrowth = 'NY.GDP.MKTP.KD.ZG',
    GNIPerCapita = 'NY.GNP.PCAP.CD',
    Inflation = 'FP.CPI.TOTL.ZG',
    TradeBalance = 'NE.RSB.GNFS.ZS',
}

interface IndicatorInfo {
    label: string;
    format: (value: number) => string;
}

const formatNumber = (value: number, decimals: number): string => {
    if (Math.abs(value) >= 1e9) {
        return (value / 1e9).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + ' billion';
    }
    if (Math.abs(value) >= 1e6) {
        return (value / 1e6).toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }) + ' million';
    }
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

export const indicatorInfo: Record<WorldBankIndicators, IndicatorInfo> = {
    [WorldBankIndicators.Population]: {
        label: 'Population',
        format: (value) => formatNumber(value, 0)
    },
    [WorldBankIndicators.PopulationGrowth]: {
        label: 'Population Growth',
        format: (value) => `${formatNumber(value, 2)}%`
    },
    [WorldBankIndicators.LifeExpectancy]: {
        label: 'Life Expectancy',
        format: (value) => `${formatNumber(value, 1)} years`
    },
    [WorldBankIndicators.AdultLiteracyRate]: {
        label: 'Adult Literacy Rate',
        format: (value) => `${formatNumber(value, 1)}%`
    },
    [WorldBankIndicators.CO2Emissions]: {
        label: 'CO2 Emissions',
        format: (value) => `${formatNumber(value, 2)} metric tons per capita`
    },
    [WorldBankIndicators.ForestArea]: {
        label: 'Forest Area',
        format: (value) => `${formatNumber(value, 2)}% of land area`
    },
    [WorldBankIndicators.AccessToElectricity]: {
        label: 'Access to Electricity',
        format: (value) => `${formatNumber(value, 2)}% of population`
    },
    [WorldBankIndicators.UnemploymentRate]: {
        label: 'Unemployment Rate',
        format: (value) => `${formatNumber(value, 3)}%`
    },
    [WorldBankIndicators.GDP]: {
        label: 'GDP',
        format: (value) => `$${formatNumber(value / 1e9, 2)} billion`
    },
    [WorldBankIndicators.GDPPerCapita]: {
        label: 'GDP Per Capita',
        format: (value) => `$${formatNumber(value, 2)}`
    },
    [WorldBankIndicators.GDPGrowth]: {
        label: 'GDP Growth',
        format: (value) => `${formatNumber(value, 2)}%`
    },
    [WorldBankIndicators.GNIPerCapita]: {
        label: 'GNI Per Capita',
        format: (value) => `$${formatNumber(value, 0)}`
    },
    [WorldBankIndicators.Inflation]: {
        label: 'Inflation',
        format: (value) => `${formatNumber(value, 2)}%`
    },
    [WorldBankIndicators.TradeBalance]: {
        label: 'Trade Balance',
        format: (value) => `${formatNumber(value, 2)}% of GDP`
    },
};

export const getIndicatorLabel = (indicator: WorldBankIndicators): string => {
    return indicatorInfo[indicator].label;
};

export const formatIndicatorValue = (indicator: WorldBankIndicators, value: number): string => {
    return indicatorInfo[indicator].format(value);
};