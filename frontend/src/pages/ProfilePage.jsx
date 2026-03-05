import { useNavigate } from 'react-router-dom';
import Background from '../assets/images/Background.png';
import AuthInput from '../components/ui/AuthInput';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, PROFILE_INPUT_FIELDS } from '../hooks/useProfile';
import { useChangePassword } from '../hooks/useChangePassword';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileFieldRow from '../components/profile/ProfileFieldRow';
import AccountTypeSection from '../components/profile/AccountTypeSection';
import PasswordSection from '../components/profile/PasswordSection';

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
    <div className="min-h-screen flex justify-center px-4 py-8 text-text-main relative overflow-x-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <img src={Background} alt="" className="w-full h-full object-cover blur-lg" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(125deg, rgba(9,9,10,0.9), rgba(14,14,25,0.9))',
          }}
        />
      </div>

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
              ({ key, label, type, placeholder, numeric, extraProps }) => (
                <ProfileFieldRow key={key} label={label}>
                  <AuthInput
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={
                      numeric ? handleNumericChange(key) : handleChange(key)
                    }
                    {...extraProps}
                  />
                </ProfileFieldRow>
              )
            )}

            <ProfileFieldRow label="Gênero:">
              <div className="flex items-center gap-3 h-[55px] rounded-[10px] border border-border-muted bg-surface-input/20 backdrop-blur-2xl px-3 text-sm text-text-muted">
                <select
                  value={form.gender}
                  onChange={handleChange('gender')}
                  className="w-full h-full bg-transparent text-sm text-text-main focus:outline-none"
                >
                  <option value="">Não selecionado</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>
            </ProfileFieldRow>

            <div className="pt-6 flex justify-center">
              <button
                type="submit"
                disabled={saving || loading || !hasChanges}
                className="w-full md:w-1/2 h-[54px] rounded-[10px] bg-brand text-text-main hover:text-text-main/80 text-sm font-medium flex items-center justify-center hover:bg-brand/70 disabled:bg-brand/20 disabled:text-text-main/60 disabled:hover:bg-brand/20 disabled:cursor-not-allowed transition-colors"
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