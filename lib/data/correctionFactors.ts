// lib/data/correctionFactors.ts
// Généré automatiquement depuis FACTEUR_DE_CORRECTION_DENSITES.xlsx
// Table de conversion température → facteurs de correction pour densité
// 211 températures de 15.0°C à 36.0°C

export interface CorrectionFactor {
  temperature: number;
  facteurLiquide: number;
  facteurGaz: number;
}

export const CORRECTION_FACTORS_TABLE: CorrectionFactor[] = [
  {
    "temperature": 15.0,
    "facteurLiquide": 0.0,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.1,
    "facteurLiquide": 0.0001,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.2,
    "facteurLiquide": 0.0002,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.3,
    "facteurLiquide": 0.0003,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.4,
    "facteurLiquide": 0.0004,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.5,
    "facteurLiquide": 0.0005,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.6,
    "facteurLiquide": 0.0007,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.7,
    "facteurLiquide": 0.0008,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.8,
    "facteurLiquide": 0.0009,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 15.9,
    "facteurLiquide": 0.001,
    "facteurGaz": 0.00244
  },
  {
    "temperature": 16.0,
    "facteurLiquide": 0.0011,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.1,
    "facteurLiquide": 0.0012,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.2,
    "facteurLiquide": 0.0013,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.3,
    "facteurLiquide": 0.0015,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.4,
    "facteurLiquide": 0.0016,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.5,
    "facteurLiquide": 0.0017,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.6,
    "facteurLiquide": 0.0018,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.7,
    "facteurLiquide": 0.0019,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.8,
    "facteurLiquide": 0.0021,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 16.9,
    "facteurLiquide": 0.0022,
    "facteurGaz": 0.00243
  },
  {
    "temperature": 17.0,
    "facteurLiquide": 0.0023,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.1,
    "facteurLiquide": 0.0024,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.2,
    "facteurLiquide": 0.0025,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.3,
    "facteurLiquide": 0.0026,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.4,
    "facteurLiquide": 0.0027,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.5,
    "facteurLiquide": 0.0028,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.6,
    "facteurLiquide": 0.003,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.7,
    "facteurLiquide": 0.0031,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.8,
    "facteurLiquide": 0.0032,
    "facteurGaz": 0.00242
  },
  {
    "temperature": 17.9,
    "facteurLiquide": 0.0033,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.0,
    "facteurLiquide": 0.0034,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.1,
    "facteurLiquide": 0.0035,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.2,
    "facteurLiquide": 0.0036,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.3,
    "facteurLiquide": 0.0038,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.4,
    "facteurLiquide": 0.0039,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.5,
    "facteurLiquide": 0.004,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.6,
    "facteurLiquide": 0.0041,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.7,
    "facteurLiquide": 0.0042,
    "facteurGaz": 0.00241
  },
  {
    "temperature": 18.8,
    "facteurLiquide": 0.0043,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 18.9,
    "facteurLiquide": 0.0044,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.0,
    "facteurLiquide": 0.0045,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.1,
    "facteurLiquide": 0.0047,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.2,
    "facteurLiquide": 0.0048,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.3,
    "facteurLiquide": 0.005,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.4,
    "facteurLiquide": 0.0051,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.5,
    "facteurLiquide": 0.0052,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.6,
    "facteurLiquide": 0.0053,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.7,
    "facteurLiquide": 0.0054,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.8,
    "facteurLiquide": 0.0056,
    "facteurGaz": 0.0024
  },
  {
    "temperature": 19.9,
    "facteurLiquide": 0.0057,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.0,
    "facteurLiquide": 0.0058,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.1,
    "facteurLiquide": 0.0059,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.2,
    "facteurLiquide": 0.006,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.3,
    "facteurLiquide": 0.0061,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.4,
    "facteurLiquide": 0.0062,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.5,
    "facteurLiquide": 0.0063,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.6,
    "facteurLiquide": 0.0065,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.7,
    "facteurLiquide": 0.0066,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.8,
    "facteurLiquide": 0.0067,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 20.9,
    "facteurLiquide": 0.0068,
    "facteurGaz": 0.00239
  },
  {
    "temperature": 21.0,
    "facteurLiquide": 0.0069,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.1,
    "facteurLiquide": 0.007,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.2,
    "facteurLiquide": 0.0071,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.3,
    "facteurLiquide": 0.0073,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.4,
    "facteurLiquide": 0.0074,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.5,
    "facteurLiquide": 0.0075,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.6,
    "facteurLiquide": 0.0076,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.7,
    "facteurLiquide": 0.0077,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.8,
    "facteurLiquide": 0.0078,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 21.9,
    "facteurLiquide": 0.0079,
    "facteurGaz": 0.00238
  },
  {
    "temperature": 22.0,
    "facteurLiquide": 0.0081,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.1,
    "facteurLiquide": 0.0082,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.2,
    "facteurLiquide": 0.0083,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.3,
    "facteurLiquide": 0.0084,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.4,
    "facteurLiquide": 0.0085,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.5,
    "facteurLiquide": 0.0086,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.6,
    "facteurLiquide": 0.0087,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.7,
    "facteurLiquide": 0.0088,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.8,
    "facteurLiquide": 0.0089,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 22.9,
    "facteurLiquide": 0.009,
    "facteurGaz": 0.00237
  },
  {
    "temperature": 23.0,
    "facteurLiquide": 0.0092,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.1,
    "facteurLiquide": 0.0093,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.2,
    "facteurLiquide": 0.0094,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.3,
    "facteurLiquide": 0.0096,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.4,
    "facteurLiquide": 0.0097,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.5,
    "facteurLiquide": 0.0098,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.6,
    "facteurLiquide": 0.0099,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.7,
    "facteurLiquide": 0.01,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.8,
    "facteurLiquide": 0.0101,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 23.9,
    "facteurLiquide": 0.0103,
    "facteurGaz": 0.00236
  },
  {
    "temperature": 24.0,
    "facteurLiquide": 0.0104,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.1,
    "facteurLiquide": 0.0105,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.2,
    "facteurLiquide": 0.0106,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.3,
    "facteurLiquide": 0.0107,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.4,
    "facteurLiquide": 0.0108,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.5,
    "facteurLiquide": 0.011,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.6,
    "facteurLiquide": 0.0111,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.7,
    "facteurLiquide": 0.0112,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.8,
    "facteurLiquide": 0.0114,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 24.9,
    "facteurLiquide": 0.0115,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 25.0,
    "facteurLiquide": 0.0116,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 25.1,
    "facteurLiquide": 0.0117,
    "facteurGaz": 0.00235
  },
  {
    "temperature": 25.2,
    "facteurLiquide": 0.0118,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.3,
    "facteurLiquide": 0.0119,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.4,
    "facteurLiquide": 0.012,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.5,
    "facteurLiquide": 0.0121,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.6,
    "facteurLiquide": 0.0123,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.7,
    "facteurLiquide": 0.0123,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.8,
    "facteurLiquide": 0.0125,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 25.9,
    "facteurLiquide": 0.0126,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 26.0,
    "facteurLiquide": 0.0127,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 26.1,
    "facteurLiquide": 0.0128,
    "facteurGaz": 0.00234
  },
  {
    "temperature": 26.2,
    "facteurLiquide": 0.0129,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.3,
    "facteurLiquide": 0.0131,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.4,
    "facteurLiquide": 0.0132,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.5,
    "facteurLiquide": 0.0333,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.6,
    "facteurLiquide": 0.0134,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.7,
    "facteurLiquide": 0.0135,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.8,
    "facteurLiquide": 0.0137,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 26.9,
    "facteurLiquide": 0.0138,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 27.0,
    "facteurLiquide": 0.0139,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 27.1,
    "facteurLiquide": 0.014,
    "facteurGaz": 0.00233
  },
  {
    "temperature": 27.2,
    "facteurLiquide": 0.0141,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.3,
    "facteurLiquide": 0.0142,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.4,
    "facteurLiquide": 0.0143,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.5,
    "facteurLiquide": 0.0144,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.6,
    "facteurLiquide": 0.0146,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.7,
    "facteurLiquide": 0.0147,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.8,
    "facteurLiquide": 0.0148,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 27.9,
    "facteurLiquide": 0.0149,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 28.0,
    "facteurLiquide": 0.015,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 28.1,
    "facteurLiquide": 0.0151,
    "facteurGaz": 0.00232
  },
  {
    "temperature": 28.2,
    "facteurLiquide": 0.0152,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.3,
    "facteurLiquide": 0.0154,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.4,
    "facteurLiquide": 0.0155,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.5,
    "facteurLiquide": 0.0156,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.6,
    "facteurLiquide": 0.0157,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.7,
    "facteurLiquide": 0.0158,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.8,
    "facteurLiquide": 0.016,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 28.9,
    "facteurLiquide": 0.0161,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 29.0,
    "facteurLiquide": 0.0162,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 29.1,
    "facteurLiquide": 0.0163,
    "facteurGaz": 0.00231
  },
  {
    "temperature": 29.2,
    "facteurLiquide": 0.0164,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.3,
    "facteurLiquide": 0.0165,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.4,
    "facteurLiquide": 0.0167,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.5,
    "facteurLiquide": 0.0168,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.6,
    "facteurLiquide": 0.0169,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.7,
    "facteurLiquide": 0.017,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.8,
    "facteurLiquide": 0.0172,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 29.9,
    "facteurLiquide": 0.0173,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.0,
    "facteurLiquide": 0.0174,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.1,
    "facteurLiquide": 0.0175,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.2,
    "facteurLiquide": 0.0176,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.3,
    "facteurLiquide": 0.0177,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.4,
    "facteurLiquide": 0.0178,
    "facteurGaz": 0.0023
  },
  {
    "temperature": 30.5,
    "facteurLiquide": 0.0179,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 30.6,
    "facteurLiquide": 0.0181,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 30.7,
    "facteurLiquide": 0.0181,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 30.8,
    "facteurLiquide": 0.0182,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 30.9,
    "facteurLiquide": 0.0183,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.0,
    "facteurLiquide": 0.0184,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.1,
    "facteurLiquide": 0.0185,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.2,
    "facteurLiquide": 0.0186,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.3,
    "facteurLiquide": 0.0187,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.4,
    "facteurLiquide": 0.0189,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.5,
    "facteurLiquide": 0.019,
    "facteurGaz": 0.00229
  },
  {
    "temperature": 31.6,
    "facteurLiquide": 0.0191,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 31.7,
    "facteurLiquide": 0.0192,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 31.8,
    "facteurLiquide": 0.0194,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 31.9,
    "facteurLiquide": 0.0195,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.0,
    "facteurLiquide": 0.0196,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.1,
    "facteurLiquide": 0.0197,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.2,
    "facteurLiquide": 0.0198,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.3,
    "facteurLiquide": 0.0199,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.4,
    "facteurLiquide": 0.0201,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.5,
    "facteurLiquide": 0.0202,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.6,
    "facteurLiquide": 0.0203,
    "facteurGaz": 0.00228
  },
  {
    "temperature": 32.7,
    "facteurLiquide": 0.0204,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 32.8,
    "facteurLiquide": 0.0205,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 32.9,
    "facteurLiquide": 0.0206,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.0,
    "facteurLiquide": 0.0207,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.1,
    "facteurLiquide": 0.0208,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.2,
    "facteurLiquide": 0.0209,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.3,
    "facteurLiquide": 0.021,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.4,
    "facteurLiquide": 0.0211,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.5,
    "facteurLiquide": 0.0212,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.6,
    "facteurLiquide": 0.0214,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.7,
    "facteurLiquide": 0.0215,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.8,
    "facteurLiquide": 0.0216,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 33.9,
    "facteurLiquide": 0.0217,
    "facteurGaz": 0.00227
  },
  {
    "temperature": 34.0,
    "facteurLiquide": 0.0218,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.1,
    "facteurLiquide": 0.0219,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.2,
    "facteurLiquide": 0.0221,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.3,
    "facteurLiquide": 0.0222,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.4,
    "facteurLiquide": 0.0223,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.5,
    "facteurLiquide": 0.0224,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.6,
    "facteurLiquide": 0.0225,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.7,
    "facteurLiquide": 0.0226,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.8,
    "facteurLiquide": 0.0228,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 34.9,
    "facteurLiquide": 0.0229,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 35.0,
    "facteurLiquide": 0.023,
    "facteurGaz": 0.00226
  },
  {
    "temperature": 35.1,
    "facteurLiquide": 0.0231,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.2,
    "facteurLiquide": 0.0232,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.3,
    "facteurLiquide": 0.0234,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.4,
    "facteurLiquide": 0.0235,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.5,
    "facteurLiquide": 0.0236,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.6,
    "facteurLiquide": 0.0237,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.7,
    "facteurLiquide": 0.0238,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.8,
    "facteurLiquide": 0.024,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 35.9,
    "facteurLiquide": 0.0241,
    "facteurGaz": 0.00225
  },
  {
    "temperature": 36.0,
    "facteurLiquide": 0.0242,
    "facteurGaz": 0.00225
  }
];

/**
 * Obtenir les facteurs de correction par interpolation linéaire
 * @param temperature Température en °C
 * @returns Facteurs de correction liquide et gaz
 */
export function getCorrectionFactors(temperature: number): {
  facteurLiquide: number;
  facteurGaz: number;
} {
  // Arrondir à 1 décimale pour correspondance exacte
  const temp = Math.round(temperature * 10) / 10;
  
  // Recherche de correspondance exacte
  const exact = CORRECTION_FACTORS_TABLE.find(f => f.temperature === temp);
  if (exact) {
    return {
      facteurLiquide: exact.facteurLiquide,
      facteurGaz: exact.facteurGaz
    };
  }
  
  // Si température hors limites, utiliser les bornes
  const minTemp = CORRECTION_FACTORS_TABLE[0].temperature;
  const maxTemp = CORRECTION_FACTORS_TABLE[CORRECTION_FACTORS_TABLE.length - 1].temperature;
  
  if (temp < minTemp) {
    console.warn(`Température ${temp}°C inférieure à la limite min (${minTemp}°C), utilisation des facteurs min`);
    return {
      facteurLiquide: CORRECTION_FACTORS_TABLE[0].facteurLiquide,
      facteurGaz: CORRECTION_FACTORS_TABLE[0].facteurGaz
    };
  }
  
  if (temp > maxTemp) {
    console.warn(`Température ${temp}°C supérieure à la limite max (${maxTemp}°C), utilisation des facteurs max`);
    const last = CORRECTION_FACTORS_TABLE[CORRECTION_FACTORS_TABLE.length - 1];
    return {
      facteurLiquide: last.facteurLiquide,
      facteurGaz: last.facteurGaz
    };
  }
  
  // Trouver les deux valeurs encadrantes pour interpolation linéaire
  let lower = CORRECTION_FACTORS_TABLE[0];
  let upper = CORRECTION_FACTORS_TABLE[CORRECTION_FACTORS_TABLE.length - 1];
  
  for (let i = 0; i < CORRECTION_FACTORS_TABLE.length - 1; i++) {
    if (
      CORRECTION_FACTORS_TABLE[i].temperature <= temp &&
      CORRECTION_FACTORS_TABLE[i + 1].temperature >= temp
    ) {
      lower = CORRECTION_FACTORS_TABLE[i];
      upper = CORRECTION_FACTORS_TABLE[i + 1];
      break;
    }
  }
  
  // Interpolation linéaire
  const range = upper.temperature - lower.temperature;
  const ratio = range !== 0 ? (temp - lower.temperature) / range : 0;
  
  return {
    facteurLiquide: lower.facteurLiquide + ratio * (upper.facteurLiquide - lower.facteurLiquide),
    facteurGaz: lower.facteurGaz + ratio * (upper.facteurGaz - lower.facteurGaz)
  };
}

/**
 * Vérifier si une température est dans la plage supportée
 */
export function isTemperatureInRange(temperature: number): boolean {
  const minTemp = CORRECTION_FACTORS_TABLE[0].temperature;
  const maxTemp = CORRECTION_FACTORS_TABLE[CORRECTION_FACTORS_TABLE.length - 1].temperature;
  return temperature >= minTemp && temperature <= maxTemp;
}

/**
 * Obtenir la plage de températures supportée
 */
export function getTemperatureRange(): { min: number; max: number } {
  return {
    min: CORRECTION_FACTORS_TABLE[0].temperature,
    max: CORRECTION_FACTORS_TABLE[CORRECTION_FACTORS_TABLE.length - 1].temperature
  };
}