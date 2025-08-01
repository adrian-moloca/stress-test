export const validatePatient = (patient: any) => {
  return (
    patient.name &&
    patient.surname &&
    patient.birthDate &&
    patient.gender &&
    patient.genderBirth &&
    patient.nationality &&
    patient.cardInsuranceNumber &&
    patient.germanInsuranceId &&
    patient.phoneNumber &&
    patient.email &&
    patient.address.street &&
    patient.address.houseNumber &&
    patient.address.postalCode &&
    patient.address.city &&
    patient.address.country
  )
}
