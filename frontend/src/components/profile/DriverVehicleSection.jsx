import SectionCard from './SectionCard';
import ProfileFieldRow from './ProfileFieldRow';
import AuthInput from '../ui/AuthInput';

export default function DriverVehicleSection({
  vehicleForm,
  vehicleLoading,
  vehicleSaving,
  hasVehicleChanges,
  vehicleUploadingPhoto,
  vehiclePhotoName,
  vehicleFileInputRef,
  handleVehicleChange,
  handleVehicleNumericChange,
  handleVehiclePhotoClick,
  handleVehiclePhotoChange,
  handleVehicleSubmit,
}) {
  return (
    <SectionCard className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm font-medium text-text-main">Dados do veículo:</p>
        <p className="text-xs text-text-main/70">
          Informe os dados do carro utilizado para as caronas. Esses dados podem ser exibidos para
          passageiros nas corridas.
        </p>
      </header>

      <form onSubmit={handleVehicleSubmit} className="space-y-[5px]">
        <ProfileFieldRow label="Marca:">
          <AuthInput
            type="text"
            placeholder="Ex: Fiat, Volkswagen"
            value={vehicleForm.brand}
            onChange={handleVehicleChange('brand')}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Modelo:">
          <AuthInput
            type="text"
            placeholder="Ex: Uno, Gol"
            value={vehicleForm.model}
            onChange={handleVehicleChange('model')}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Placa:">
          <AuthInput
            type="text"
            placeholder="Placa do veículo"
            value={vehicleForm.plate}
            onChange={handleVehicleChange('plate')}
            maxLength={8}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Ano:">
          <AuthInput
            type="number"
            placeholder="Ano do veículo"
            value={vehicleForm.year}
            onChange={handleVehicleNumericChange('year')}
            min={1980}
            max={new Date().getFullYear() + 1}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Capacidade:">
          <AuthInput
            type="number"
            placeholder="Número de passageiros (excluindo o motorista)"
            value={vehicleForm.capacityTotal}
            onChange={handleVehicleNumericChange('capacityTotal')}
            min={1}
            max={8}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Foto:">
          <div className="flex items-center gap-3 h-[55px]">
            <div className="w-10 h-10 rounded-[8px] border border-border-muted bg-surface-input/20 overflow-hidden flex items-center justify-center">
              {vehicleForm.photoUrl ? (
                <img
                  src={vehicleForm.photoUrl}
                  alt="Foto do veículo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-text-muted">Sem foto</span>
              )}
            </div>
            <span className="flex-1 text-xs text-text-muted truncate">
              {vehiclePhotoName ||
                (vehicleForm.photoUrl
                  ? 'Foto selecionada'
                  : 'Nenhum arquivo selecionado')}
            </span>
            <button
              type="button"
              onClick={handleVehiclePhotoClick}
              disabled={vehicleUploadingPhoto}
              className="h-[40px] px-4 rounded-[10px] bg-brand text-text-main text-xs font-medium hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
            >
              {vehicleUploadingPhoto ? 'Enviando...' : 'Upload'}
            </button>
            <input
              ref={vehicleFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleVehiclePhotoChange}
            />
          </div>
        </ProfileFieldRow>

        <div className="pt-4 flex justify-center">
          <button
            type="submit"
            disabled={vehicleSaving || vehicleLoading || !hasVehicleChanges}
            className="w-full h-[54px] rounded-[10px] bg-brand text-text-main hover:text-text-main/80 text-sm font-medium flex items-center justify-center hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
          >
            <span>
              {vehicleSaving ? 'Salvando dados do veículo...' : 'Atualizar dados do veículo'}
            </span>
          </button>
        </div>
      </form>
    </SectionCard>
  );
}