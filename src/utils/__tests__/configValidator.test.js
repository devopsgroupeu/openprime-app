import {
  validateField,
  validateServiceConfig,
  validateEnvironmentConfig,
  getValidationSummary,
  ConfigValidationError
} from '../configValidator';
import { FIELD_TYPES } from '../../config/servicesConfig';

describe('configValidator', () => {
  describe('validateField', () => {
    test('validates required text field', () => {
      const fieldConfig = {
        type: FIELD_TYPES.TEXT,
        displayName: 'Environment Name',
        required: true
      };

      const errors = validateField(fieldConfig, '', 'name');
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigValidationError);
      expect(errors[0].message).toContain('required');
    });

    test('validates number field within range', () => {
      const fieldConfig = {
        type: FIELD_TYPES.NUMBER,
        displayName: 'Min Nodes',
        min: 1,
        max: 10
      };

      expect(validateField(fieldConfig, 5, 'minNodes')).toHaveLength(0);
      expect(validateField(fieldConfig, 0, 'minNodes')).toHaveLength(1);
      expect(validateField(fieldConfig, 15, 'minNodes')).toHaveLength(1);
    });

    test('validates dropdown field options', () => {
      const fieldConfig = {
        type: FIELD_TYPES.DROPDOWN,
        displayName: 'Instance Type',
        options: [
          { value: 't3.micro', label: 't3.micro' },
          { value: 't3.small', label: 't3.small' }
        ]
      };

      expect(validateField(fieldConfig, 't3.micro', 'instanceType')).toHaveLength(0);
      expect(validateField(fieldConfig, 'invalid', 'instanceType')).toHaveLength(1);
    });

    test('validates pattern for text field', () => {
      const fieldConfig = {
        type: FIELD_TYPES.TEXT,
        displayName: 'CIDR Block',
        validation: { pattern: /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/ }
      };

      expect(validateField(fieldConfig, '10.0.0.0/16', 'cidr')).toHaveLength(0);
      expect(validateField(fieldConfig, 'invalid-cidr', 'cidr')).toHaveLength(1);
    });
  });

  describe('validateServiceConfig', () => {
    test('validates VPC service config', () => {
      const vpcConfig = {
        enabled: true,
        cidr: '10.0.0.0/16',
        azCount: 2,
        publicSubnets: 2,
        privateSubnets: 2,
        natGateway: 'single',
        enableVpnGateway: false,
        enableFlowLogs: true,
        enableDnsHostnames: true,
        enableDnsSupport: true
      };

      const errors = validateServiceConfig('vpc', vpcConfig);
      expect(errors).toHaveLength(0);
    });

    test('validates EKS node count constraints', () => {
      const eksConfig = {
        enabled: true,
        version: '1.28',
        minNodes: 5,
        maxNodes: 2, // Invalid: min > max
        nodeGroups: 1
      };

      const errors = validateServiceConfig('eks', eksConfig);
      const nodeCountError = errors.find(e => e.field === 'nodeCount');
      expect(nodeCountError).toBeDefined();
    });
  });

  describe('validateEnvironmentConfig', () => {
    test('validates complete environment config', () => {
      const environment = {
        name: 'Test Environment',
        provider: 'aws',
        region: 'us-east-1',
        services: {
          vpc: {
            enabled: true,
            cidr: '10.0.0.0/16',
            azCount: 2,
            publicSubnets: 2,
            privateSubnets: 2,
            natGateway: 'single',
            enableVpnGateway: false,
            enableFlowLogs: true,
            enableDnsHostnames: true,
            enableDnsSupport: true
          }
        }
      };

      const errors = validateEnvironmentConfig(environment);
      expect(errors).toHaveLength(0);
    });

    test('validates cross-service dependencies', () => {
      const environment = {
        name: 'Test Environment',
        provider: 'aws',
        region: 'us-east-1',
        services: {
          eks: { enabled: true, version: '1.28' },
          // Missing VPC dependency
        }
      };

      const errors = validateEnvironmentConfig(environment);
      const eksError = errors.find(e => e.field === 'eks');
      expect(eksError).toBeDefined();
      expect(eksError.message).toContain('requires VPC');
    });
  });

  describe('getValidationSummary', () => {
    test('returns validation summary', () => {
      const errors = [
        new ConfigValidationError('Name is required', 'name'),
        new ConfigValidationError('Recommended setting', 'setting')
      ];

      const summary = getValidationSummary(errors);
      expect(summary.isValid).toBe(false);
      expect(summary.totalErrors).toBe(2);
      expect(summary.hasBlockingErrors).toBe(true);
    });

    test('returns valid summary for no errors', () => {
      const summary = getValidationSummary([]);
      expect(summary.isValid).toBe(true);
      expect(summary.totalErrors).toBe(0);
      expect(summary.hasBlockingErrors).toBe(false);
    });
  });
});
