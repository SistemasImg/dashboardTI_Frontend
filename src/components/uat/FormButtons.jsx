import PropTypes from 'prop-types';

FormButtons.propTypes = {
  isEditing: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default function FormButtons({
  isEditing,
  onCancel,
  loading = false,
  className = '',
}) {
  const getButtonContent = () => {
    if (loading) {
      return (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="4"
              fill="none"
            />
          </svg>
          Saving...
        </span>
      );
    }

    return isEditing ? 'Update' : 'Save';
  };

  return (
    <div className={`flex ${className} justify-end gap-4`}>
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-md border-4 px-4 py-2 text-base font-semibold text-white shadow-lg transition sm:w-auto
  ${
    loading
      ? 'cursor-not-allowed border-gray-400 bg-gray-400'
      : 'border-indigo-600 bg-indigo-600 hover:bg-indigo-700'
  }`}
      >
        {getButtonContent()}
      </button>

      <button
        type="button"
        disabled={loading}
        className={`w-full rounded-md border-4 border-pink-400 px-4 py-2 text-base font-semibold text-pink-900 shadow-lg transition sm:w-auto
        ${
          loading
            ? 'cursor-not-allowed bg-pink-200 opacity-70'
            : 'bg-pink-100 hover:bg-pink-200'
        }`}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
