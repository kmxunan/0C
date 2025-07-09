import { jest } from '@jest/globals';
import GreenElectricityTracing from '../../src/core/services/GreenElectricityTracing.js';
import { ENERGY_CONSTANTS, MATH_CONSTANTS } from '../../src/shared/constants/MathConstants.js';

describe('GreenElectricityTracing', () => {
  let greenElectricityTracing;
  let mockDatabase;
  let mockBlockchain;

  beforeEach(() => {
    // Mock数据库和区块链接口
    mockDatabase = {
      saveCertificate: jest.fn(),
      getCertificate: jest.fn(),
      updateCertificateStatus: jest.fn(),
      queryCertificates: jest.fn()
    };

    mockBlockchain = {
      recordTransaction: jest.fn(),
      verifyTransaction: jest.fn(),
      getTransactionHistory: jest.fn()
    };

    greenElectricityTracing = new GreenElectricityTracing({
      database: mockDatabase,
      blockchain: mockBlockchain
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初始化测试', () => {
    test('应该正确初始化绿色电力追溯系统', () => {
      expect(greenElectricityTracing).toBeDefined();
      expect(greenElectricityTracing.certificateRegistry).toBeDefined();
      expect(greenElectricityTracing.traceabilityChain).toBeDefined();
    });

    test('应该加载绿电证书标准配置', () => {
      expect(greenElectricityTracing.certificateStandards).toBeDefined();
      expect(greenElectricityTracing.certificateStandards.validityPeriod).toBe(12); // 12个月
      expect(greenElectricityTracing.certificateStandards.minimumGeneration).toBe(1000); // 1000kWh
    });
  });

  describe('绿电证书生成', () => {
    test('应该正确生成绿电证书', async () => {
      const generationData = {
        facilityId: 'SOLAR_001',
        facilityName: '园区光伏发电站A',
        generationType: 'solar',
        generationAmount: 50000, // kWh
        generationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        location: {
          province: '江苏省',
          city: '苏州市',
          coordinates: { lat: 31.2989, lng: 120.5853 }
        },
        certificationBody: '国家可再生能源信息管理中心'
      };

      mockDatabase.saveCertificate.mockResolvedValue({ id: 'CERT_001' });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0x123abc' });

      const certificate = await greenElectricityTracing.generateCertificate(generationData);
      
      expect(certificate.certificateId).toBeDefined();
      expect(certificate.generationAmount).toBe(50000);
      expect(certificate.generationType).toBe('solar');
      expect(certificate.status).toBe('active');
      expect(certificate.blockchainHash).toBe('0x123abc');
      expect(certificate.issuedAt).toBeDefined();
      expect(certificate.expiresAt).toBeDefined();
    });

    test('应该验证发电数据完整性', async () => {
      const incompleteData = {
        facilityId: 'WIND_001',
        generationAmount: 30000
        // 缺少必要字段
      };

      await expect(greenElectricityTracing.generateCertificate(incompleteData))
        .rejects.toThrow('Missing required generation data');
    });

    test('应该支持不同类型的可再生能源', async () => {
      const energyTypes = [
        { type: 'solar', amount: 40000 },
        { type: 'wind', amount: 60000 },
        { type: 'hydro', amount: 20000 },
        { type: 'biomass', amount: 15000 }
      ];

      mockDatabase.saveCertificate.mockResolvedValue({ id: 'CERT_TEST' });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0xtest' });

      for (const energy of energyTypes) {
        const generationData = {
          facilityId: `${energy.type.toUpperCase()}_001`,
          facilityName: `园区${energy.type}发电站`,
          generationType: energy.type,
          generationAmount: energy.amount,
          generationPeriod: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          location: { province: '江苏省', city: '苏州市' },
          certificationBody: '国家可再生能源信息管理中心'
        };

        const certificate = await greenElectricityTracing.generateCertificate(generationData);
        expect(certificate.generationType).toBe(energy.type);
        expect(certificate.generationAmount).toBe(energy.amount);
      }
    });

    test('应该计算证书有效期', async () => {
      const generationData = {
        facilityId: 'SOLAR_002',
        facilityName: '园区光伏发电站B',
        generationType: 'solar',
        generationAmount: 25000,
        generationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        location: { province: '江苏省', city: '苏州市' },
        certificationBody: '国家可再生能源信息管理中心'
      };

      mockDatabase.saveCertificate.mockResolvedValue({ id: 'CERT_002' });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0x456def' });

      const certificate = await greenElectricityTracing.generateCertificate(generationData);
      
      const issuedDate = new Date(certificate.issuedAt);
      const expiryDate = new Date(certificate.expiresAt);
      const monthsDiff = (expiryDate.getFullYear() - issuedDate.getFullYear()) * 12 + 
                        (expiryDate.getMonth() - issuedDate.getMonth());
      
      expect(monthsDiff).toBe(12); // 12个月有效期
    });
  });

  describe('绿电证书交易', () => {
    test('应该支持证书转让交易', async () => {
      const transferData = {
        certificateId: 'CERT_001',
        fromEntity: 'PARK_GENERATOR',
        toEntity: 'ENTERPRISE_A',
        transferAmount: 10000, // kWh
        transferPrice: 0.05, // 元/kWh
        transferReason: '绿电采购协议',
        contractReference: 'CONTRACT_2024_001'
      };

      mockDatabase.getCertificate.mockResolvedValue({
        certificateId: 'CERT_001',
        generationAmount: 50000,
        remainingAmount: 50000,
        status: 'active'
      });

      mockDatabase.updateCertificateStatus.mockResolvedValue({ success: true });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0x789ghi' });

      const transfer = await greenElectricityTracing.transferCertificate(transferData);
      
      expect(transfer.transferId).toBeDefined();
      expect(transfer.certificateId).toBe('CERT_001');
      expect(transfer.transferAmount).toBe(10000);
      expect(transfer.fromEntity).toBe('PARK_GENERATOR');
      expect(transfer.toEntity).toBe('ENTERPRISE_A');
      expect(transfer.blockchainHash).toBe('0x789ghi');
      expect(transfer.status).toBe('completed');
    });

    test('应该验证转让数量不超过可用余额', async () => {
      const transferData = {
        certificateId: 'CERT_001',
        fromEntity: 'PARK_GENERATOR',
        toEntity: 'ENTERPRISE_B',
        transferAmount: 60000, // 超过可用量
        transferPrice: 0.05
      };

      mockDatabase.getCertificate.mockResolvedValue({
        certificateId: 'CERT_001',
        generationAmount: 50000,
        remainingAmount: 30000, // 剩余30000kWh
        status: 'active'
      });

      await expect(greenElectricityTracing.transferCertificate(transferData))
        .rejects.toThrow('Transfer amount exceeds available balance');
    });

    test('应该支持证书拆分交易', async () => {
      const splitData = {
        certificateId: 'CERT_001',
        splits: [
          { entity: 'ENTERPRISE_A', amount: 20000, price: 0.05 },
          { entity: 'ENTERPRISE_B', amount: 15000, price: 0.05 },
          { entity: 'ENTERPRISE_C', amount: 10000, price: 0.05 }
        ]
      };

      mockDatabase.getCertificate.mockResolvedValue({
        certificateId: 'CERT_001',
        generationAmount: 50000,
        remainingAmount: 50000,
        status: 'active'
      });

      mockDatabase.updateCertificateStatus.mockResolvedValue({ success: true });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0xsplit' });

      const splitResult = await greenElectricityTracing.splitCertificate(splitData);
      
      expect(splitResult.originalCertificateId).toBe('CERT_001');
      expect(splitResult.newCertificates).toHaveLength(3);
      expect(splitResult.totalSplitAmount).toBe(45000);
      expect(splitResult.remainingAmount).toBe(5000);
    });
  });

  describe('绿电消费追溯', () => {
    test('应该记录绿电消费数据', async () => {
      const consumptionData = {
        consumerId: 'ENTERPRISE_A',
        consumerName: '园区企业A',
        certificateId: 'CERT_001',
        consumptionAmount: 8000, // kWh
        consumptionPeriod: {
          startDate: '2024-02-01',
          endDate: '2024-02-29'
        },
        meterReadings: {
          startReading: 100000,
          endReading: 108000,
          meterId: 'METER_A001'
        },
        purpose: '生产用电'
      };

      mockDatabase.getCertificate.mockResolvedValue({
        certificateId: 'CERT_001',
        remainingAmount: 10000,
        status: 'active'
      });

      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0xconsume' });

      const consumption = await greenElectricityTracing.recordConsumption(consumptionData);
      
      expect(consumption.consumptionId).toBeDefined();
      expect(consumption.certificateId).toBe('CERT_001');
      expect(consumption.consumptionAmount).toBe(8000);
      expect(consumption.consumerId).toBe('ENTERPRISE_A');
      expect(consumption.blockchainHash).toBe('0xconsume');
      expect(consumption.carbonReduction).toBeGreaterThan(0);
    });

    test('应该计算绿电消费的碳减排量', async () => {
      const consumptionData = {
        consumerId: 'ENTERPRISE_B',
        certificateId: 'CERT_002',
        consumptionAmount: 10000, // kWh
        consumptionPeriod: {
          startDate: '2024-02-01',
          endDate: '2024-02-29'
        }
      };

      mockDatabase.getCertificate.mockResolvedValue({
        certificateId: 'CERT_002',
        remainingAmount: 15000,
        status: 'active',
        generationType: 'solar'
      });

      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0xcarbon' });

      const consumption = await greenElectricityTracing.recordConsumption(consumptionData);
      
      // 验证碳减排计算 (假设电网排放因子为0.5703 kgCO2/kWh)
      const expectedReduction = 10000 * 0.5703 / 1000; // 转换为吨CO2
      expect(consumption.carbonReduction).toBeCloseTo(expectedReduction, 2);
      expect(consumption.carbonReductionUnit).toBe('吨CO2');
    });

    test('应该生成绿电消费证明', async () => {
      const consumptionId = 'CONSUMPTION_001';
      
      mockDatabase.queryCertificates.mockResolvedValue([
        {
          consumptionId: 'CONSUMPTION_001',
          certificateId: 'CERT_001',
          consumerId: 'ENTERPRISE_A',
          consumptionAmount: 8000,
          carbonReduction: 4.56,
          consumptionPeriod: { startDate: '2024-02-01', endDate: '2024-02-29' }
        }
      ]);

      const proof = await greenElectricityTracing.generateConsumptionProof(consumptionId);
      
      expect(proof.proofId).toBeDefined();
      expect(proof.consumptionId).toBe('CONSUMPTION_001');
      expect(proof.certificateChain).toBeDefined();
      expect(proof.verificationStatus).toBe('verified');
      expect(proof.carbonReductionCertified).toBe(4.56);
      expect(proof.issuedBy).toBe('园区绿色电力追溯系统');
    });
  });

  describe('区块链追溯验证', () => {
    test('应该验证证书的区块链记录', async () => {
      const certificateId = 'CERT_001';
      
      mockBlockchain.getTransactionHistory.mockResolvedValue([
        {
          txHash: '0x123abc',
          type: 'certificate_generation',
          timestamp: '2024-01-01T00:00:00Z',
          data: { certificateId: 'CERT_001', amount: 50000 }
        },
        {
          txHash: '0x789ghi',
          type: 'certificate_transfer',
          timestamp: '2024-01-15T00:00:00Z',
          data: { certificateId: 'CERT_001', amount: 10000, to: 'ENTERPRISE_A' }
        }
      ]);

      const verification = await greenElectricityTracing.verifyCertificateChain(certificateId);
      
      expect(verification.certificateId).toBe('CERT_001');
      expect(verification.isValid).toBe(true);
      expect(verification.transactionCount).toBe(2);
      expect(verification.chainIntegrity).toBe('intact');
      expect(verification.lastVerifiedAt).toBeDefined();
    });

    test('应该检测区块链记录异常', async () => {
      const certificateId = 'CERT_INVALID';
      
      mockBlockchain.getTransactionHistory.mockResolvedValue([
        {
          txHash: '0xbad123',
          type: 'certificate_generation',
          timestamp: '2024-01-01T00:00:00Z',
          data: { certificateId: 'CERT_INVALID', amount: 50000 }
        },
        {
          txHash: '0xbad456',
          type: 'certificate_transfer',
          timestamp: '2024-01-15T00:00:00Z',
          data: { certificateId: 'CERT_INVALID', amount: 60000 } // 转让量超过生成量
        }
      ]);

      const verification = await greenElectricityTracing.verifyCertificateChain(certificateId);
      
      expect(verification.isValid).toBe(false);
      expect(verification.anomalies).toContain('transfer_amount_exceeds_generation');
      expect(verification.chainIntegrity).toBe('compromised');
    });

    test('应该支持批量验证', async () => {
      const certificateIds = ['CERT_001', 'CERT_002', 'CERT_003'];
      
      mockBlockchain.getTransactionHistory
        .mockResolvedValueOnce([{ txHash: '0x001', type: 'certificate_generation' }])
        .mockResolvedValueOnce([{ txHash: '0x002', type: 'certificate_generation' }])
        .mockResolvedValueOnce([{ txHash: '0x003', type: 'certificate_generation' }]);

      const batchVerification = await greenElectricityTracing.batchVerifyCertificates(certificateIds);
      
      expect(batchVerification.totalCertificates).toBe(3);
      expect(batchVerification.validCertificates).toBe(3);
      expect(batchVerification.invalidCertificates).toBe(0);
      expect(batchVerification.verificationResults).toHaveLength(3);
    });
  });

  describe('绿电统计分析', () => {
    test('应该生成绿电生产统计报告', async () => {
      const reportPeriod = {
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      };

      mockDatabase.queryCertificates.mockResolvedValue([
        { generationType: 'solar', generationAmount: 100000, issuedAt: '2024-01-15' },
        { generationType: 'wind', generationAmount: 80000, issuedAt: '2024-02-15' },
        { generationType: 'solar', generationAmount: 120000, issuedAt: '2024-03-15' }
      ]);

      const report = await greenElectricityTracing.generateProductionReport(reportPeriod);
      
      expect(report.totalGeneration).toBe(300000);
      expect(report.byEnergyType.solar).toBe(220000);
      expect(report.byEnergyType.wind).toBe(80000);
      expect(report.certificateCount).toBe(3);
      expect(report.averageMonthlyGeneration).toBeCloseTo(100000, 0);
    });

    test('应该生成绿电消费统计报告', async () => {
      const reportPeriod = {
        startDate: '2024-01-01',
        endDate: '2024-03-31'
      };

      mockDatabase.queryCertificates.mockResolvedValue([
        { consumerId: 'ENTERPRISE_A', consumptionAmount: 50000, carbonReduction: 28.5 },
        { consumerId: 'ENTERPRISE_B', consumptionAmount: 30000, carbonReduction: 17.1 },
        { consumerId: 'ENTERPRISE_A', consumptionAmount: 20000, carbonReduction: 11.4 }
      ]);

      const report = await greenElectricityTracing.generateConsumptionReport(reportPeriod);
      
      expect(report.totalConsumption).toBe(100000);
      expect(report.totalCarbonReduction).toBe(57);
      expect(report.byConsumer['ENTERPRISE_A'].consumption).toBe(70000);
      expect(report.byConsumer['ENTERPRISE_B'].consumption).toBe(30000);
      expect(report.uniqueConsumers).toBe(2);
    });

    test('应该计算绿电自给率', async () => {
      const analysisData = {
        parkTotalGeneration: 200000, // kWh
        parkTotalConsumption: 150000, // kWh
        externalGreenPurchase: 30000, // kWh
        period: '2024-Q1'
      };

      const analysis = await greenElectricityTracing.calculateSelfSufficiencyRate(analysisData);
      
      expect(analysis.selfSufficiencyRate).toBeCloseTo(1.33, 2); // 200000/150000
      expect(analysis.greenElectricityRate).toBeCloseTo(1.53, 2); // (200000+30000)/150000
      expect(analysis.excessGeneration).toBe(50000);
      expect(analysis.isNetPositive).toBe(true);
    });
  });

  describe('合规性检查', () => {
    test('应该验证证书符合国家标准', async () => {
      const certificateData = {
        certificateId: 'CERT_001',
        generationType: 'solar',
        generationAmount: 50000,
        facilityCapacity: 100, // kW
        certificationBody: '国家可再生能源信息管理中心',
        issuedAt: '2024-01-01T00:00:00Z'
      };

      const compliance = await greenElectricityTracing.checkNationalCompliance(certificateData);
      
      expect(compliance.isCompliant).toBe(true);
      expect(compliance.standardsChecked).toContain('GB/T 33761-2017');
      expect(compliance.certificationBodyValid).toBe(true);
      expect(compliance.generationDataValid).toBe(true);
    });

    test('应该检查证书有效期', async () => {
      const expiredCertificate = {
        certificateId: 'CERT_EXPIRED',
        issuedAt: '2023-01-01T00:00:00Z',
        expiresAt: '2024-01-01T00:00:00Z' // 已过期
      };

      const validityCheck = await greenElectricityTracing.checkCertificateValidity(expiredCertificate);
      
      expect(validityCheck.isValid).toBe(false);
      expect(validityCheck.status).toBe('expired');
      expect(validityCheck.daysOverdue).toBeGreaterThan(0);
    });

    test('应该验证发电设施资质', async () => {
      const facilityData = {
        facilityId: 'SOLAR_001',
        facilityType: 'solar',
        capacity: 100, // kW
        commissionDate: '2023-06-01',
        certifications: ['CQC认证', 'TUV认证'],
        gridConnection: true
      };

      const qualification = await greenElectricityTracing.verifyFacilityQualification(facilityData);
      
      expect(qualification.isQualified).toBe(true);
      expect(qualification.certificationsValid).toBe(true);
      expect(qualification.gridConnectionVerified).toBe(true);
      expect(qualification.capacityVerified).toBe(true);
    });
  });

  describe('性能和安全测试', () => {
    test('应该保证数据加密存储', async () => {
      const sensitiveData = {
        facilityId: 'SOLAR_001',
        generationAmount: 50000,
        contractDetails: '商业敏感信息'
      };

      const encrypted = await greenElectricityTracing.encryptSensitiveData(sensitiveData);
      
      expect(encrypted.data).not.toContain('商业敏感信息');
      expect(encrypted.encryptionMethod).toBe('AES-256-GCM');
      expect(encrypted.keyId).toBeDefined();

      const decrypted = await greenElectricityTracing.decryptSensitiveData(encrypted);
      expect(decrypted.contractDetails).toBe('商业敏感信息');
    });

    test('应该支持高并发证书生成', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        facilityId: `SOLAR_${i.toString().padStart(3, '0')}`,
        facilityName: `光伏发电站${i}`,
        generationType: 'solar',
        generationAmount: 10000 + i * 1000,
        generationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        location: { province: '江苏省', city: '苏州市' },
        certificationBody: '国家可再生能源信息管理中心'
      }));

      mockDatabase.saveCertificate.mockResolvedValue({ id: 'CERT_CONCURRENT' });
      mockBlockchain.recordTransaction.mockResolvedValue({ txHash: '0xconcurrent' });

      const startTime = Date.now();
      const results = await Promise.all(
        concurrentRequests.map(data => greenElectricityTracing.generateCertificate(data))
      );
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(results.every(cert => cert.certificateId)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 应在5秒内完成
    });

    test('应该防止重复证书生成', async () => {
      const duplicateData = {
        facilityId: 'SOLAR_001',
        generationPeriod: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        generationAmount: 50000
      };

      mockDatabase.queryCertificates.mockResolvedValue([
        {
          facilityId: 'SOLAR_001',
          generationPeriod: { startDate: '2024-01-01', endDate: '2024-01-31' },
          status: 'active'
        }
      ]);

      await expect(greenElectricityTracing.generateCertificate(duplicateData))
        .rejects.toThrow('Certificate already exists for this period');
    });
  });
});