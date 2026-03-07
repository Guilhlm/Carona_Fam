import { useNavigate } from 'react-router-dom';
import AuthInput from '../components/ui/AuthInput';
import CustomSelect from '../components/ui/CustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, PROFILE_INPUT_FIELDS } from '../hooks/useProfile';
import { useChangePassword } from '../hooks/useChangePassword';
import { useVehicleProfile } from '../hooks/useVehicleProfile';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileFieldRow from '../components/profile/ProfileFieldRow';
import AccountTypeSection from '../components/profile/AccountTypeSection';
import PasswordSection from '../components/profile/PasswordSection';
import DriverVehicleSection from '../components/profile/DriverVehicleSection';

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const {
    user,
    form,
    loading,
    saving,
    uploadingPhoto,
    hasChanges,
    fileInputRef,
    handleChange,
    handleNumericChange,
    handlePhoneChange,
    handleCepChange,
    handleAvatarClick,
    handleAvatarChange,
    handleSubmit,
    displayName,
    displayEmail,
    displayPhoto,
    role,
    updatingRole,
    handleRoleChange,
  } = useProfile();

  const {
    vehicleForm,
    vehicleLoading,
    vehicleSaving,
    hasVehicleChanges,
    handleVehicleChange,
    handleVehicleNumericChange,
    vehicleUploadingPhoto,
    vehiclePhotoName,
    vehicleFileInputRef,
    isAddingNewVehicle,
    vehiclesList,
    selectedVehicleId,
    vehicleSelectOptions,
    handleVehiclePhotoClick,
    handleVehiclePhotoChange,
    handleVehicleSubmit,
    handleNewVehicleClick,
    handleVehicleSelect,
  } = useVehicleProfile();

  const {
    newPassword,
    confirmPassword,
    loading: changingPassword,
    setNewPassword,
    setConfirmPassword,
    handleSubmit: handlePasswordSubmit,
  } = useChangePassword();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex justify-center px-4 pt-10 pb-2 text-text-main relative overflow-x-hidden">
      <div className="w-full max-w-4xl">
        <div className="rounded-[10px] border-2 border-border-muted bg-surface-input/20 backdrop-blur-2xl px-6 py-7 md:px-10 md:py-9 shadow-2xl text-sm text-text-main relative space-y-8">
          <ProfileHeader
            displayName={displayName}
            displayPhoto={displayPhoto}
            uploadingPhoto={uploadingPhoto}
            fileInputRef={fileInputRef}
            onAvatarClick={handleAvatarClick}
            onAvatarChange={handleAvatarChange}
            onLogout={handleLogout}
          />

          <form onSubmit={handleSubmit} className="space-y-[5px]">
            <ProfileFieldRow label="Email:">
              <AuthInput
                type="email"
                placeholder="Seu email"
                value={displayEmail}
                onChange={handleChange('email')}
              />
            </ProfileFieldRow>

            {PROFILE_INPUT_FIELDS.map(
              ({ key, label, type, placeholder, numeric, phoneFormat, cepFormat, extraProps }) => (
                <ProfileFieldRow key={key} label={label}>
                  <AuthInput
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={
                      phoneFormat
                        ? handlePhoneChange
                        : cepFormat
                          ? handleCepChange
                          : numeric
                            ? handleNumericChange(key)
                            : handleChange(key)
                    }
                    {...extraProps}
                  />
                </ProfileFieldRow>
              )
            )}

            <ProfileFieldRow label="Gênero:">
              <div className="w-full">
                <CustomSelect
                  value={form.gender}
                  onChange={(value) => handleChange('gender')({ target: { value } })}
                  options={[
                    { value: '', label: 'Não selecionado' },
                    { value: 'MASCULINO', label: 'Masculino' },
                    { value: 'FEMININO', label: 'Feminino' },
                  ]}
                  placeholder="Não selecionado"
                  size="md"
                  aria-label="Gênero"
                />
              </div>
            </ProfileFieldRow>

            <div className="pt-6 flex justify-center">
              <button
                type="submit"
                disabled={saving || loading || !hasChanges}
                className="w-full h-[54px] rounded-[10px] bg-brand text-text-main hover:text-text-main/80 text-sm font-medium flex items-center justify-center hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
              >
                <span>{saving ? 'Salvando...' : 'Atualizar Cadastro'}</span>
              </button>
            </div>
          </form>

          <AccountTypeSection
            role={role}
            updatingRole={updatingRole}
            onChangeRole={handleRoleChange}
          />

          {role === 'DRIVER' && (
            <DriverVehicleSection
              vehicleForm={vehicleForm}
              vehicleLoading={vehicleLoading}
              vehicleSaving={vehicleSaving}
              hasVehicleChanges={hasVehicleChanges}
              vehicleUploadingPhoto={vehicleUploadingPhoto}
              vehiclePhotoName={vehiclePhotoName}
              vehicleFileInputRef={vehicleFileInputRef}
              isAddingNewVehicle={isAddingNewVehicle}
              vehiclesList={vehiclesList}
              selectedVehicleId={selectedVehicleId}
              vehicleSelectOptions={vehicleSelectOptions}
              handleVehicleChange={handleVehicleChange}
              handleVehicleNumericChange={handleVehicleNumericChange}
              handleVehiclePhotoClick={handleVehiclePhotoClick}
              handleVehiclePhotoChange={handleVehiclePhotoChange}
              handleVehicleSubmit={handleVehicleSubmit}
              handleNewVehicleClick={handleNewVehicleClick}
              handleVehicleSelect={handleVehicleSelect}
            />
          )}

          <PasswordSection
            displayEmail={displayEmail}
            displayName={displayName}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            onChangeNewPassword={(e) => setNewPassword(e.target.value)}
            onChangeConfirmPassword={(e) => setConfirmPassword(e.target.value)}
            changingPassword={changingPassword}
            onSubmit={handlePasswordSubmit}
          />
          
        </div>
      </div>
    </div>
  );
}