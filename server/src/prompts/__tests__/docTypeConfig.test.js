import { describe, it, expect } from '@jest/globals';
import {
  getDocTypeConfig,
  getSupportedDocTypes,
  getActiveDocTypes,
  getDocTypeOptions,
  DOC_TYPE_CONFIG
} from '../docTypeConfig.js';

describe('docTypeConfig', () => {
  describe('DOC_TYPE_CONFIG', () => {
    it('should have configuration for all supported doc types', () => {
      expect(DOC_TYPE_CONFIG).toHaveProperty('README');
      expect(DOC_TYPE_CONFIG).toHaveProperty('JSDOC');
      expect(DOC_TYPE_CONFIG).toHaveProperty('API');
      expect(DOC_TYPE_CONFIG).toHaveProperty('ARCHITECTURE');
      expect(DOC_TYPE_CONFIG).toHaveProperty('OPENAPI');
    });

    it('should have valid provider for each doc type', () => {
      const validProviders = ['claude', 'openai', 'gemini', null]; // null = use env default

      Object.entries(DOC_TYPE_CONFIG).forEach(([docType, config]) => {
        expect(validProviders).toContain(config.provider);
      });
    });

    it('should have model specified for each doc type', () => {
      Object.entries(DOC_TYPE_CONFIG).forEach(([docType, config]) => {
        expect(config.model).toBeDefined();
        // Model can be a string or null (null means use provider default)
        expect(config.model === null || typeof config.model === 'string').toBe(true);
      });
    });

    it('should have valid temperature range for each doc type', () => {
      Object.entries(DOC_TYPE_CONFIG).forEach(([docType, config]) => {
        expect(config.temperature).toBeDefined();
        expect(config.temperature).toBeGreaterThanOrEqual(0);
        expect(config.temperature).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('getDocTypeConfig()', () => {
    it('should return correct config for README', () => {
      const config = getDocTypeConfig('README');
      const expectedConfig = DOC_TYPE_CONFIG.README;

      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('temperature');
      expect(config.provider).toBe(expectedConfig.provider);
      expect(config.model).toBe(expectedConfig.model);
      expect(config.temperature).toBe(expectedConfig.temperature);
    });

    it('should return correct config for JSDOC', () => {
      const config = getDocTypeConfig('JSDOC');
      const expectedConfig = DOC_TYPE_CONFIG.JSDOC;

      expect(config.provider).toBe(expectedConfig.provider);
      expect(config.model).toBe(expectedConfig.model);
      expect(config.temperature).toBe(0.3);
    });

    it('should return correct config for API', () => {
      const config = getDocTypeConfig('API');
      const expectedConfig = DOC_TYPE_CONFIG.API;

      expect(config.provider).toBe(expectedConfig.provider);
      expect(config.model).toBe(expectedConfig.model);
      expect(config.temperature).toBe(0.5);
    });

    it('should return correct config for ARCHITECTURE', () => {
      const config = getDocTypeConfig('ARCHITECTURE');
      const expectedConfig = DOC_TYPE_CONFIG.ARCHITECTURE;

      expect(config.provider).toBe(expectedConfig.provider);
      expect(config.model).toBe(expectedConfig.model);
      expect(config.temperature).toBe(0.7);
    });

    it('should return correct config for OPENAPI', () => {
      const config = getDocTypeConfig('OPENAPI');
      const expectedConfig = DOC_TYPE_CONFIG.OPENAPI;

      expect(config.provider).toBe(expectedConfig.provider);
      expect(config.model).toBe(expectedConfig.model);
      expect(config.temperature).toBe(0.3);
    });

    it('should return default config for unknown doc type', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const config = getDocTypeConfig('UNKNOWN_TYPE');

      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('model');
      expect(config.provider).toBe(null); // Default is null (use env)
      expect(config.model).toBe(null); // Default is null (use provider default)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No config found for docType: UNKNOWN_TYPE')
      );

      consoleSpy.mockRestore();
    });

    it('should return config with all required fields', () => {
      const config = getDocTypeConfig('README');

      expect(config).toHaveProperty('provider');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('temperature');
    });
  });

  describe('getSupportedDocTypes()', () => {
    it('should return array of doc types', () => {
      const docTypes = getSupportedDocTypes();

      expect(Array.isArray(docTypes)).toBe(true);
      expect(docTypes.length).toBeGreaterThan(0);
    });

    it('should include all standard doc types', () => {
      const docTypes = getSupportedDocTypes();

      expect(docTypes).toContain('README');
      expect(docTypes).toContain('JSDOC');
      expect(docTypes).toContain('API');
      expect(docTypes).toContain('ARCHITECTURE');
      expect(docTypes).toContain('OPENAPI');
    });

    it('should return same types as DOC_TYPE_CONFIG keys', () => {
      const docTypes = getSupportedDocTypes();
      const configKeys = Object.keys(DOC_TYPE_CONFIG);

      expect(docTypes).toEqual(configKeys);
    });
  });

  describe('Temperature Configuration', () => {
    it('should use lower temperature for structured doc types', () => {
      const jsdocConfig = getDocTypeConfig('JSDOC');
      const apiConfig = getDocTypeConfig('API');

      // JSDOC and API should have lower temperature (more structured)
      expect(jsdocConfig.temperature).toBeLessThanOrEqual(0.5);
      expect(apiConfig.temperature).toBeLessThanOrEqual(0.5);
    });

    it('should use higher temperature for creative doc types', () => {
      const readmeConfig = getDocTypeConfig('README');
      const archConfig = getDocTypeConfig('ARCHITECTURE');

      // README and ARCHITECTURE should have higher temperature (more creative)
      expect(readmeConfig.temperature).toBeGreaterThanOrEqual(0.6);
      expect(archConfig.temperature).toBeGreaterThanOrEqual(0.6);
    });
  });

  describe('Provider Configuration', () => {
    it('should match configured providers for each doc type', () => {
      const docTypes = ['README', 'JSDOC', 'API', 'ARCHITECTURE', 'OPENAPI'];

      docTypes.forEach(docType => {
        const config = getDocTypeConfig(docType);
        const expectedConfig = DOC_TYPE_CONFIG[docType];

        expect(config.provider).toBe(expectedConfig.provider);
        expect(config.model).toBe(expectedConfig.model);
      });
    });

    it('should allow explicit provider overrides', () => {
      // Test that doc types can have explicit provider overrides (not null)
      const explicitOverrides = Object.entries(DOC_TYPE_CONFIG)
        .filter(([_, config]) => config.provider !== null);

      expect(explicitOverrides.length).toBeGreaterThan(0);

      explicitOverrides.forEach(([docType, config]) => {
        expect(['claude', 'openai', 'gemini']).toContain(config.provider);
      });
    });
  });

  describe('getActiveDocTypes()', () => {
    it('should return only active doc types', () => {
      const activeTypes = getActiveDocTypes();

      expect(Array.isArray(activeTypes)).toBe(true);
      expect(activeTypes.length).toBeGreaterThan(0);

      // All returned types should have active = true
      activeTypes.forEach(docType => {
        expect(DOC_TYPE_CONFIG[docType].active).toBe(true);
      });
    });

    it('should include all doc types when all are active', () => {
      const activeTypes = getActiveDocTypes();
      const allTypes = getSupportedDocTypes();

      // Currently all are active by default
      expect(activeTypes.length).toBe(allTypes.length);
    });
  });

  describe('getDocTypeOptions()', () => {
    it('should return doc types with labels', () => {
      const options = getDocTypeOptions();

      expect(Array.isArray(options)).toBe(true);
      options.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });

    it('should sort options alphabetically by label', () => {
      const options = getDocTypeOptions();

      for (let i = 0; i < options.length - 1; i++) {
        expect(options[i].label.localeCompare(options[i + 1].label)).toBeLessThanOrEqual(0);
      }
    });

    it('should return only active doc types by default', () => {
      const options = getDocTypeOptions();
      const activeTypes = getActiveDocTypes();

      expect(options.length).toBe(activeTypes.length);
    });

    it('should return all doc types when activeOnly = false', () => {
      const options = getDocTypeOptions(false);
      const allTypes = getSupportedDocTypes();

      expect(options.length).toBe(allTypes.length);
    });

    it('should include labels from config', () => {
      const options = getDocTypeOptions();

      options.forEach(option => {
        expect(option.label).toBe(DOC_TYPE_CONFIG[option.value].label);
      });
    });
  });
});
