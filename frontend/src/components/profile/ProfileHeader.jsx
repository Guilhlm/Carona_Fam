import { FiLogOut } from 'react-icons/fi';

export default function ProfileHeader({
  displayName,
  displayPhoto,
  uploadingPhoto,
  fileInputRef,
  onAvatarClick,
  onAvatarChange,
  onLogout,
}) {
  return (
    <div className="flex items-center justify-between gap-6 mb-10">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={uploadingPhoto}
          className="relative w-20 h-20 rounded-[18px] overflow-hidden border border-border-muted bg-surface-input flex items-center justify-center text-2xl font-semibold text-text-main group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{displayName.charAt(0).toUpperCase()}</span>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-text-main transition-opacity">
            {uploadingPhoto ? 'Enviando...' : 'Trocar foto'}
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarChange}
        />
        <div className="space-y-1">
          <p className="text-xs text-text-main/60">Nome completo</p>
          <p className="text-sm md:text-base font-medium text-text-main truncate max-w-xs md:max-w-sm">
            {displayName}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="text-red-500 hover:text-red-400 focus:outline-none flex items-center justify-center"
      >
        <FiLogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
