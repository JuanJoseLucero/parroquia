export function formatMoney(value) {
    if (value == null) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

export function formatFechaCalendario(fecha) {
    return fecha || '';
}

export const ESTADOS_INSCRIPCION = {
    1: 'Inscrito',
    2: 'Pagado',
    3: 'Devuelto',
    4: 'Parcial',
};

export const ESTADOS_ASISTENCIA = {
    1: 'Presente',
    2: 'Ausente',
    3: 'Justificado',
    4: 'Tardanza',
    5: 'Reservado',
};
