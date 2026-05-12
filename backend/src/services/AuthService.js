class AuthService {
  constructor({ authRepository, hashPassword, comparePassword, signToken }) {
    this.authRepository = authRepository;
    this.hashPassword = hashPassword;
    this.comparePassword = comparePassword;
    this.signToken = signToken;
  }

  async register(data) {
    const { email, password, name, ra, course, gender, age, phone, cep, role } = data;

    const existing = await this.authRepository.findByEmail(email);

    if (existing) {
      const err = new Error('Email já cadastrado');
      err.statusCode = 409;
      throw err;
    }

    if (ra) {
      const existingRa = await this.authRepository.findByRa(ra);
      if (existingRa) {
        const err = new Error('RA já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    const passwordHash = await this.hashPassword(password);
    const userRole = role || 'USER';

    const user = await this.authRepository.createUser({
      data: {
        email,
        passwordHash,
        name: name || email.split('@')[0],
        ra: ra || null,
        course: course || null,
        gender: gender || null,
        age: age ? parseInt(age, 10) : null,
        phone: phone || null,
        cep: cep || null,
        role: userRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        ra: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    const token = this.signToken({ sub: user.id, role: user.role });
    return { user, token };
  }

  async login(email, password) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      const err = new Error('Email ou senha inválidos');
      err.statusCode = 401;
      throw err;
    }

    if (user.isBlocked) {
      const err = new Error('Usuário bloqueado');
      err.statusCode = 403;
      throw err;
    }

    const valid = await this.comparePassword(password, user.passwordHash);
    if (!valid) {
      const err = new Error('Email ou senha inválidos');
      err.statusCode = 401;
      throw err;
    }

    const token = this.signToken({ sub: user.id, role: user.role });
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      ra: user.ra,
      role: user.role,
      isAdmin: user.isAdmin,
    };

    return { user: userData, token };
  }

  async resetPasswordWithEmailAndRa(email, ra, newPassword) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (!user.ra || user.ra !== ra) {
      const err = new Error('Email e RA não conferem');
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePasswordById(user.id, passwordHash);
    return { message: 'Senha redefinida com sucesso' };
  }

  async changePassword(userId, newPassword) {
    const user = await this.authRepository.findAuthUserById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePasswordById(user.id, passwordHash);
    return { message: 'Senha alterada com sucesso' };
  }
}

module.exports = AuthService;
