export default function LoginButton({ loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-[70px] rounded-[10px] bg-brand text-text-main hover:text-text-main/60 text-sm font-medium flex items-center justify-center hover:bg-brand/60 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span>{loading ? 'Entrando...' : 'Login'}</span>
    </button>
  );
}

