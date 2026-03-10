import SectionCard from './SectionCard';
import ProfileFieldRow from './ProfileFieldRow';
import AuthInput from '../ui/AuthInput';
import CustomSelect from '../ui/CustomSelect';

export default function DriverVehicleSection({
  vehicleForm,
  vehicleLoading,
  vehicleSaving,
  hasVehicleChanges,
  vehicleUploadingPhoto,
  vehiclePhotoName,
  vehicleFileInputRef,
  isAddingNewVehicle,
  vehiclesList,
  selectedVehicleId,
  vehicleSelectOptions,
  handleVehicleChange,
  handleVehicleNumericChange,
  handleVehiclePhotoClick,
  handleVehiclePhotoChange,
  handleVehicleSubmit,
  handleNewVehicleClick,
  handleVehicleSelect,
}) {
  const formDisabled = vehicleForm.isDisabled && !isAddingNewVehicle;
  const photoUploadDisabled = formDisabled || isAddingNewVehicle;
  const showVehicleDropdown = vehiclesList.length > 0 && !vehicleLoading;

  return (
    <SectionCard className="space-y-5 relative">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm font-medium text-text-main">
            {isAddingNewVehicle ? 'Cadastrar novo veículo' : 'Dados do veículo:'}
          </p>
        {vehicleForm.isDisabled && !isAddingNewVehicle ? (
          <p className="text-xs text-red-500">
            Seu carro está bloqueado por motivos de: {vehicleForm.disabledReason || 'não informado'}
          </p>
        ) : (
          <p className="text-xs text-text-main/70">
            {isAddingNewVehicle
              ? 'Preencha os dados do novo veículo. Não pode ser igual ao carro bloqueado.'
              : 'Informe os dados do carro utilizado para as caronas. Esses dados podem ser exibidos para passageiros nas corridas.'}
          </p>
        )}
        </div>
        {showVehicleDropdown && (
          <div className="shrink-0 w-full sm:w-[200px] md:w-[240px] my-2.5">
            <CustomSelect
              value={selectedVehicleId}
              onChange={handleVehicleSelect}
              options={vehicleSelectOptions}
              placeholder="Selecionar veículo"
              size="sm"
              aria-label="Selecionar veículo"
            />
          </div>
        )}
      </header>

      <form onSubmit={handleVehicleSubmit} className="space-y-[5px]">
        <div className={`space-y-[5px] transition-opacity ${formDisabled ? 'opacity-60' : 'opacity-100'}`}>
        <ProfileFieldRow label="Marca:">
          <AuthInput
            type="text"
            placeholder="Ex: Fiat, Volkswagen"
            value={vehicleForm.brand}
            onChange={handleVehicleChange('brand')}
            disabled={formDisabled}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Modelo:">
          <AuthInput
            type="text"
            placeholder="Ex: Uno, Gol"
            value={vehicleForm.model}
            onChange={handleVehicleChange('model')}
            disabled={formDisabled}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Placa:">
          <AuthInput
            type="text"
            placeholder="Placa do veículo"
            value={vehicleForm.plate}
            onChange={handleVehicleChange('plate')}
            maxLength={8}
            disabled={formDisabled}
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
            disabled={formDisabled}
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
            disabled={formDisabled}
          />
        </ProfileFieldRow>

        <ProfileFieldRow label="Foto:">
          <div className="flex items-center gap-3 h-[55px]">
            <div className="w-10 h-10 rounded-[8px] border border-border-muted bg-surface-input/20 overflow-hidden flex items-center justify-center">
              {vehicleForm.photoUrl ? (
                <img
                  key={vehicleForm.id || 'no-id'}
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
              disabled={vehicleUploadingPhoto || photoUploadDisabled}
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
        </div>

        <div className="pt-4 flex flex-col gap-3 w-full">
          <button
            type="submit"
            disabled={vehicleSaving || vehicleLoading || !hasVehicleChanges || formDisabled}
            className="w-full h-[54px] rounded-[10px] bg-brand text-text-main hover:text-text-main/80 text-sm font-medium flex items-center justify-center hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
          >
            <span>
              {vehicleSaving
                ? 'Salvando...'
                : isAddingNewVehicle
                  ? 'Cadastrar novo veículo'
                  : 'Atualizar dados do veículo'}
            </span>
          </button>
          {vehicleForm.isDisabled && !isAddingNewVehicle && vehiclesList.length < 2 && (
            <button
              type="button"
              onClick={handleNewVehicleClick}
              disabled={vehicleLoading}
              className="w-full h-[54px] rounded-[10px] border-2 border-brand text-brand text-sm font-medium flex items-center justify-center hover:bg-brand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Novo veículo
            </button>
          )}
        </div>
      </form>
    </SectionCard>
  );
}