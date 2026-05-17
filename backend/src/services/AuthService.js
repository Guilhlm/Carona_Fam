const InputNormalizer = require('../utils/InputNormalizer');
const HttpError = require('../utils/HttpError');

const DEFAULT_USER_ROLE = 'USER';
const REGISTERED_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  ra: true,
  role: true,
  isAdmin: true,
  createdAt: true,
};

class AuthService {
  constructor({ authRepository, hashPassword, comparePassword, signToken }) {
    this.authRepository = authRepository;
    this.hashPassword = hashPassword;
    this.comparePassword = comparePassword;
    this.signToken = signToken;
  }

  async register(registrationPayload) {
    const {
      email,
      password,
      name,
      ra,
      course,
      gender,
      age,
      phone,
      cep,
    } = registrationPayload;

    const normalizedEmail = InputNormalizer.normalizeEmail(email);
    const normalizedRa = InputNormalizer.normalizeDigits(ra, 20);

    const existingByEmail = await this.authRepository.findByEmail(normalizedEmail);
    if (existingByEmail) {
      throw HttpError.conflict('Email já cadastrado');
    }

    if (normalizedRa) {
      const existingByRa = await this.authRepository.findByRa(normalizedRa);
      if (existingByRa) {
        throw HttpError.conflict('RA já cadastrado');
      }
    }

    const passwordHash = await this.hashPassword(password);

    const createdUser = await this.authRepository.createUser({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: InputNormalizer.normalizeOptionalString(name) || normalizedEmail.split('@')[0],
        ra: normalizedRa || null,
        course: InputNormalizer.normalizeOptionalString(course),
        gender: InputNormalizer.normalizeOptionalString(gender),
        age: age ? parseInt(age, 10) : null,
        phone: InputNormalizer.normalizeDigits(phone, 15) || null,
        cep: InputNormalizer.normalizeDigits(cep, 8) || null,
        role: DEFAULT_USER_ROLE,
      },
      select: REGISTERED_USER_SELECT,
    });

    const accessToken = this.signToken({ sub: createdUser.id, role: createdUser.role });
    return { user: createdUser, token: accessToken };
  }

  async login(email, password) {
    const normalizedEmail = InputNormalizer.normalizeEmail(email);
    const foundUser = await this.authRepository.findByEmail(normalizedEmail);

    if (!foundUser) {
      throw HttpError.unauthorized('Email ou senha inválidos');
    }

    if (foundUser.isBlocked) {
      throw HttpError.forbidden('Usuário bloqueado');
    }

    const isPasswordValid = await this.comparePassword(password, foundUser.passwordHash);
    if (!isPasswordValid) {
      throw HttpError.unauthorized('Email ou senha inválidos');
    }

    const accessToken = this.signToken({ sub: foundUser.id, role: foundUser.role });
    const publicUser = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      ra: foundUser.ra,
      role: foundUser.role,
      isAdmin: foundUser.isAdmin,
    };

    return { user: publicUser, token: accessToken };
  }

  async resetPasswordWithEmailAndRa(email, ra, newPassword) {
    const normalizedEmail = InputNormalizer.normalizeEmail(email);
    const normalizedRa = InputNormalizer.normalizeDigits(ra, 20);
    const foundUser = await this.authRepository.findByEmail(normalizedEmail);

    if (!foundUser) {
      throw HttpError.badRequest('Não foi possível validar os dados informados');
    }

    if (!foundUser.ra || foundUser.ra !== normalizedRa) {
      throw HttpError.badRequest('Não foi possível validar os dados informados');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePasswordById(foundUser.id, passwordHash);
    return { message: 'Senha redefinida com sucesso' };
  }

  async changePassword(userId, newPassword) {
    const foundUser = await this.authRepository.findAuthUserById(userId);

    if (!foundUser) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.authRepository.updatePasswordById(foundUser.id, passwordHash);
    return { message: 'Senha alterada com sucesso' };
  }
}

module.exports = AuthService;
