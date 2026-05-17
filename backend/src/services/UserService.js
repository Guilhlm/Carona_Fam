const InputNormalizer = require('../utils/InputNormalizer');
const HttpError = require('../utils/HttpError');

class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async getMe(userId) {
    const user = await this.userRepository.findMeById(userId);

    if (!user) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    return user;
  }

  async updateMe(userId, payload) {
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    const allowedFields = [
      'name',
      'email',
      'ra',
      'course',
      'gender',
      'age',
      'phone',
      'cep',
      'photoUrl',
      'role',
    ];
    const updatePayload = {};

    allowedFields.forEach((fieldName) => {
      if (!Object.prototype.hasOwnProperty.call(payload, fieldName)) return;

      if (fieldName === 'age') {
        const rawAge = payload.age;
        if (rawAge === null || rawAge === '' || Number.isNaN(Number(rawAge))) {
          updatePayload.age = null;
        } else {
          updatePayload.age = parseInt(rawAge, 10);
        }
        return;
      }

      if (fieldName === 'gender') {
        const rawGender = payload.gender;
        if (rawGender === null || rawGender === '') {
          updatePayload.gender = null;
        } else if (typeof rawGender === 'string') {
          updatePayload.gender = rawGender.toUpperCase();
        }
        return;
      }

      if (fieldName === 'ra') {
        const normalizedRa = InputNormalizer.normalizeDigits(payload.ra, 20);
        updatePayload.ra = normalizedRa || null;
        return;
      }

      if (fieldName === 'role') {
        const rawRole = payload.role;
        const upperRole = typeof rawRole === 'string' ? rawRole.toUpperCase() : '';
        if (upperRole === 'USER' || upperRole === 'DRIVER') {
          updatePayload.role = upperRole;
        }
        return;
      }

      if (fieldName === 'email') {
        const normalizedEmail = InputNormalizer.normalizeEmail(payload.email);
        if (normalizedEmail && !InputNormalizer.isValidEmail(normalizedEmail)) {
          throw HttpError.badRequest('Informe um e-mail válido');
        }
        updatePayload.email = normalizedEmail || null;
        return;
      }

      if (fieldName === 'phone') {
        const normalizedPhone = InputNormalizer.normalizeDigits(payload.phone, 15);
        updatePayload.phone = normalizedPhone || null;
        return;
      }

      if (fieldName === 'cep') {
        const normalizedCep = InputNormalizer.normalizeDigits(payload.cep, 8);
        updatePayload.cep = normalizedCep || null;
        return;
      }

      updatePayload[fieldName] = InputNormalizer.normalizeOptionalString(payload[fieldName]);
    });

    if (
      Object.prototype.hasOwnProperty.call(updatePayload, 'ra') &&
      updatePayload.ra &&
      updatePayload.ra !== existing.ra
    ) {
      const otherWithSameRa = await this.userRepository.findByRa(updatePayload.ra);
      if (otherWithSameRa && otherWithSameRa.id !== userId) {
        throw HttpError.conflict('RA já cadastrado');
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updatePayload, 'email') &&
      updatePayload.email &&
      updatePayload.email !== existing.email
    ) {
      const otherWithSameEmail = await this.userRepository.findByEmail(updatePayload.email);
      if (otherWithSameEmail && otherWithSameEmail.id !== userId) {
        throw HttpError.conflict('Email já cadastrado');
      }
    }

    return this.userRepository.updateById(userId, updatePayload);
  }
}

module.exports = UserService;
