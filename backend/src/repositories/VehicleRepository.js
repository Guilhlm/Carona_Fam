class VehicleRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  findVehiclesByDriver(driverId) {
    return this.prisma.vehicle.findMany({
      where: { driverId },
      orderBy: [{ isDisabled: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findVehicleByIdAndDriver(vehicleId, driverId) {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, driverId },
    });
  }

  findVehicleMetaByDriver(driverId) {
    return this.prisma.vehicle.findMany({
      where: { driverId },
      select: { id: true, plate: true, isDisabled: true },
    });
  }

  createVehicle(data) {
    return this.prisma.vehicle.create({ data });
  }

  updateVehicleById(id, data) {
    return this.prisma.vehicle.update({
      where: { id },
      data,
    });
  }
}

module.exports = VehicleRepository;
