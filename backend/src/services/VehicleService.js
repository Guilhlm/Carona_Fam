const MAX_VEHICLES_PER_DRIVER = 2;

class VehicleService {
  constructor({ vehicleRepository }) {
    this.vehicleRepository = vehicleRepository;
  }

  async getMyVehicle(driverId) {
    const vehicles = await this.vehicleRepository.findVehiclesByDriver(driverId);
    return vehicles[0] || null;
  }

  getMyVehicles(driverId) {
    return this.vehicleRepository.findVehiclesByDriver(driverId);
  }

  async createNewVehicle(driverId, data) {
    const allVehicles = await this.vehicleRepository.findVehicleMetaByDriver(driverId);

    if (allVehicles.length >= MAX_VEHICLES_PER_DRIVER) {
      const err = new Error('Você atingiu o limite máximo de 2 veículos cadastrados.');
      err.statusCode = 400;
      throw err;
    }

    const disabledVehicles = allVehicles.filter((vehicle) => vehicle.isDisabled);

    if (disabledVehicles.length === 0) {
      const err = new Error('Apenas é possível cadastrar novo veículo quando o atual está bloqueado.');
      err.statusCode = 400;
      throw err;
    }

    const newPlate =
      data.plate != null && String(data.plate).trim()
        ? String(data.plate).trim().toUpperCase()
        : null;

    if (newPlate) {
      const isSameAsBlocked = disabledVehicles.some(
        (vehicle) => vehicle.plate && String(vehicle.plate).toUpperCase() === newPlate
      );
      if (isSameAsBlocked) {
        const err = new Error('Não é possível cadastrar um veículo com a mesma placa do carro bloqueado.');
        err.statusCode = 400;
        throw err;
      }
    }

    const payload = {
      brand: data.brand || null,
      model: data.model || null,
      plate: newPlate,
      year:
        data.year != null && !Number.isNaN(Number(data.year))
          ? parseInt(data.year, 10)
          : null,
      capacityTotal: Number.isNaN(parseInt(data.capacityTotal, 10))
        ? 4
        : parseInt(data.capacityTotal, 10),
      photoUrl: data.photoUrl || null,
    };

    return this.vehicleRepository.createVehicle({
      driverId,
      ...payload,
    });
  }

  async upsertMyVehicle(driverId, data) {
    const vehicleId = data.id || data.vehicleId;
    let existing = null;

    if (vehicleId) {
      existing = await this.vehicleRepository.findVehicleByIdAndDriver(vehicleId, driverId);
    }

    if (!existing) {
      const vehicles = await this.vehicleRepository.findVehiclesByDriver(driverId);
      existing = vehicles[0] || null;
    }

    const payload = {};

    if (typeof data.brand !== 'undefined') {
      payload.brand = data.brand || null;
    }

    if (typeof data.model !== 'undefined') {
      payload.model = data.model || null;
    }

    if (typeof data.plate !== 'undefined') {
      payload.plate = data.plate;
    }

    if (typeof data.year !== 'undefined') {
      payload.year =
        data.year === null || data.year === '' || Number.isNaN(Number(data.year))
          ? null
          : parseInt(data.year, 10);
    }

    if (typeof data.capacityTotal !== 'undefined') {
      const capacityNumber = parseInt(data.capacityTotal, 10);
      payload.capacityTotal = Number.isNaN(capacityNumber) ? 4 : capacityNumber;
    }

    if (typeof data.photoUrl !== 'undefined') {
      payload.photoUrl = data.photoUrl || null;
    }

    if (existing) {
      return this.vehicleRepository.updateVehicleById(existing.id, payload);
    }

    const plate =
      payload.plate != null && String(payload.plate).trim()
        ? String(payload.plate).trim()
        : null;

    return this.vehicleRepository.createVehicle({
      driverId,
      brand: payload.brand || null,
      model: payload.model || null,
      plate,
      year: typeof payload.year === 'number' ? payload.year : null,
      capacityTotal:
        typeof payload.capacityTotal === 'number' ? payload.capacityTotal : 4,
      photoUrl: payload.photoUrl || null,
    });
  }
}

module.exports = VehicleService;