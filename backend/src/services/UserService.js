class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async getMe(userId) {
    const user = await this.userRepository.findMeById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }

  async updateMe(userId, data) {
    const existing = await this.userRepository.findById(userId);

    if (!existing) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
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
    const updateData = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        if (field === 'age') {
          if (data.age === null || data.age === '' || Number.isNaN(Number(data.age))) {
            updateData.age = null;
          } else {
            updateData.age = parseInt(data.age, 10);
          }
        } else if (field === 'gender') {
          const value = data.gender;
          if (value === null || value === '') {
            updateData.gender = null;
          } else if (typeof value === 'string') {
            updateData.gender = value.toUpperCase();
          }
        } else if (field === 'ra') {
          const value = data.ra;
          updateData.ra = value === '' ? null : value;
        } else if (field === 'role') {
          const raw = data.role;
          const value = typeof raw === 'string' ? raw.toUpperCase() : '';
          if (value === 'USER' || value === 'DRIVER') {
            updateData.role = value;
          }
        } else {
          updateData[field] = data[field] === '' ? null : data[field];
        }
      }
    });

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'ra') &&
      updateData.ra &&
      updateData.ra !== existing.ra
    ) {
      const otherWithSameRa = await this.userRepository.findByRa(updateData.ra);
      if (otherWithSameRa && otherWithSameRa.id !== userId) {
        const err = new Error('RA já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(updateData, 'email') &&
      updateData.email &&
      updateData.email !== existing.email
    ) {
      const otherWithSameEmail = await this.userRepository.findByEmail(updateData.email);
      if (otherWithSameEmail && otherWithSameEmail.id !== userId) {
        const err = new Error('Email já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    return this.userRepository.updateById(userId, updateData);
  }
}

module.exports = UserService;
