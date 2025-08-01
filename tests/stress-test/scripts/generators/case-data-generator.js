const { faker } = require('@faker-js/faker');
const fs = require('fs').promises;
const path = require('path');

class CaseDataGenerator {
  constructor(options = {}) {
    this.faker = faker;
    this.options = {
      patientPoolSize: options.patientPoolSize || 1000,
      doctorPoolSize: options.doctorPoolSize || 50,
      contractPoolSize: options.contractPoolSize || 10,
      opStandardPoolSize: options.opStandardPoolSize || 100,
      ...options
    };
    
    // Store real reference data passed from stress test
    this.realReferenceData = options.realReferenceData || {};
    
    // Initialize reference data arrays
    this.doctors = [];
    this.contracts = [];
    this.opStandards = [];
    this.patients = [];
    this.materials = [];
    this.medications = [];
    
    this.caseIndex = 0;
  }

  async initialize(resultsDir) {
    this.resultsDir = resultsDir;
    
    // Generate reference data pools
    await this.generateReferenceData();
    
    console.log('✅ Case data generator initialized');
  }

  async generateReferenceData() {
    console.log('📊 Generating reference data...');
    
    // Use real contract IDs if available, otherwise use working real IDs
    this.contracts = this.realReferenceData.contractIds?.length > 0 
      ? this.realReferenceData.contractIds
      : [
          'contract_DSg8orNxSST5FKjpz',
          'contract_fBcmjb7KxyZcbXHdS', 
          'contract_8gvCPHbqX77uKAhcR'
        ];
    
    // Use real doctor IDs if available, otherwise use working real IDs  
    this.doctors = this.realReferenceData.doctorIds?.length > 0
      ? this.realReferenceData.doctorIds
      : [
          'user_6EnqFa5TaWCtuy4wD',  // Dr Maria Montessori
          'user_m8jwbhyayXsWHYejt',  // John Black  
          'user_eY4NJhj5mCSnX9f2w'   // happy path doctor 25/06
        ];
    
    // Use real op standard IDs if available, otherwise use working real IDs
    this.opStandards = this.realReferenceData.opStandardIds?.length > 0
      ? this.realReferenceData.opStandardIds
      : [
          'op_TdqjJp7oNJiG6oRbF',   // G- this is an op standard without anesthesia
          'op_msEfjHdjtR8uWy8ei',   // this is an op standard with anesthesia type periph
          'op_XyoZchRyvFzP5m4ow',   // c2
          'op_5L4D7nEqXDsMsMLFv'    // cat d
        ];

    // Generate patients as before
    this.patients = Array.from({ length: this.options.patientPoolSize }, (_, i) => ({
      id: `patient-${(i + 1).toString().padStart(4, '0')}`,
      name: this.faker.person.firstName(),
      surname: this.faker.person.lastName()
    }));

    // Materials and medications catalog
    this.materials = [
      { id: 'MAT_001', name: 'Surgical Suture', unitCost: 15.50 },
      { id: 'MAT_002', name: 'Gauze Pad', unitCost: 2.25 },
      { id: 'MAT_003', name: 'Surgical Gloves', unitCost: 8.00 },
      { id: 'MAT_004', name: 'Scalpel Blade', unitCost: 12.00 },
      { id: 'MAT_005', name: 'Surgical Drape', unitCost: 25.00 }
    ];

    this.medications = [
      { id: 'MED_001', name: 'Propofol' },
      { id: 'MED_002', name: 'Fentanyl' },
      { id: 'MED_003', name: 'Midazolam' },
      { id: 'MED_004', name: 'Sevoflurane' },
      { id: 'MED_005', name: 'Rocuronium' }
    ];

    console.log(`   👨‍⚕️ Using ${this.doctors.length} real doctors:`, this.doctors);
    console.log(`   📄 Using ${this.contracts.length} real contracts:`, this.contracts);
    console.log(`   🏥 Using ${this.opStandards.length} real op standards:`, this.opStandards);
    console.log(`   👥 Generated ${this.patients.length} patients`);
  }

  async generateBatch(batchSize) {
    const batch = [];
    
    for (let i = 0; i < batchSize; i++) {
      batch.push(this.generateSingleCase(i));
    }
    
    return batch;
  }

  generateSingleCase(index) {
    const caseNumber = `STRESS_${(index + 1).toString().padStart(6, '0')}`;
    
    // Generate realistic dates
    const bookingDate = this.faker.date.future();
    const birthDate = this.faker.date.past({ years: 80, refDate: new Date(2000, 0, 1) });
    
    const caseData = {
      caseNumber,
      status: 'PENDING',
      bookingPatient: {
        name: this.faker.person.firstName(),
        surname: this.faker.person.lastName(),
        patientId: `P${this.faker.string.numeric(6)}`,
        birthDate: birthDate.toISOString(),
        gender: this.faker.helpers.arrayElement(['MALE', 'FEMALE']),
        genderBirth: this.faker.helpers.arrayElement(['MALE', 'FEMALE']),
        germanInsuranceStatus: 'NONE', // Simplify for stress testing
        address: {
          street: this.faker.location.streetAddress(),
          houseNumber: this.faker.location.buildingNumber(),
          postalCode: this.faker.location.zipCode(),
          city: this.faker.location.city(),
          country: 'Germany'
        }
      },
      bookingSection: {
        date: bookingDate.toISOString(),
        doctorId: this.selectRandomDoctor(),
        contractId: this.selectRandomContract(),
        opStandardId: this.selectRandomOpStandard(),
        duration: this.faker.number.int({ min: 30, max: 240 }),
        name: '',
        roomType: null,
        calendarNotes: '',
        calendarPreOpNotes: '',
        calendarPostOpNotes: ''
      },
      preOpSection: {
        materials: this.generateMaterials(),
        medications: this.generateMedications(),
        documents: []
      },
      surgerySection: {
        approach: this.faker.helpers.arrayElement(['Laparoscopic', 'Open', 'Robotic']),
        estimatedBloodLoss: this.faker.number.int({ min: 50, max: 500 }),
        positions: ['SUPINE_POSITION'],
        documents: []
      },
      anesthesiaSection: {
        anesthesiaTypes: [this.faker.helpers.arrayElement(['General_Anesthesia', 'Regional_Anesthesia', 'Local_Anesthesia'])],
        medications: this.generateAnesthesiaMedications(),
        documents: []
      },
      billingSection: {
        billingContact: 'DOCTOR' // RecipientType.DOCTOR
      },
      timestamps: {
        createdAt: new Date().toISOString()
      }
    };
    
    return caseData;
  }

  selectRandomDoctor() {
    if (!this.doctors || this.doctors.length === 0) {
      return 'user_6EnqFa5TaWCtuy4wD'; // Fallback to your user ID
    }
    return this.faker.helpers.arrayElement(this.doctors);
  }

  selectRandomContract() {
    if (!this.contracts || this.contracts.length === 0) {
      return 'contract_DSg8orNxSST5FKjpz'; // Fallback to real contract
    }
    return this.faker.helpers.arrayElement(this.contracts);
  }

  selectRandomOpStandard() {
    if (!this.opStandards || this.opStandards.length === 0) {
      return 'op_TdqjJp7oNJiG6oRbF'; // Fallback to real op standard
    }
    return this.faker.helpers.arrayElement(this.opStandards);
  }

  generateMaterials() {
    const materialCount = this.faker.number.int({ min: 1, max: 3 });
    const materials = [];
    
    for (let i = 0; i < materialCount; i++) {
      const material = this.faker.helpers.arrayElement(this.materials);
      materials.push({
        materialId: material.id,
        code: this.faker.string.alphanumeric(8).toUpperCase(),
        name: material.name,
        quantity: this.faker.number.int({ min: 1, max: 10 }),
        unitCost: material.unitCost
      });
    }
    
    return materials;
  }

  generateMedications() {
    const medicationCount = this.faker.number.int({ min: 0, max: 2 });
    const medications = [];
    
    for (let i = 0; i < medicationCount; i++) {
      const medication = this.faker.helpers.arrayElement(this.medications);
      medications.push({
        medicationId: medication.id,
        code: this.faker.string.alphanumeric(8).toUpperCase(),
        name: medication.name,
        dosage: `${this.faker.number.int({ min: 5, max: 100 })}mg`,
        quantity: this.faker.number.int({ min: 1, max: 5 })
      });
    }
    
    return medications;
  }

  generateAnesthesiaMedications() {
    const medication = this.faker.helpers.arrayElement(this.medications);
    return [{
      medicationId: medication.id,
      name: medication.name,
      dosage: `${this.faker.number.int({ min: 10, max: 50 })}mg`
    }];
  }
}

module.exports = CaseDataGenerator;