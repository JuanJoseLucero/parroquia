import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import NuevaInscripcion from './components/Inscripcion/NuevaInscripcion';
import EditarInscripcion from './components/Inscripcion/EditarInscripcion';
import RealizarPago from './components/Pago/RealizarPago';
import ListarParticipantes from './components/Listados/ListarParticipantes';
import ListarGuias from './components/Listados/ListarGuias';
import RegistroGuia from './components/Listados/RegistroGuia';
import GenerarReportes from './components/Reportes/GenerarReportes';
import InscripcionPublica from './components/Publico/InscripcionPublica';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/inscripcion" element={<InscripcionPublica />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/inscripciones/nueva" element={<NuevaInscripcion />} />
                        <Route path="/inscripciones/editar/:id" element={<EditarInscripcion />} />
                        <Route path="/inscripciones/pago" element={<RealizarPago />} />
                        <Route path="/participantes" element={<ListarParticipantes />} />
                        <Route path="/guias" element={<ListarGuias />} />
                        <Route path="/guias/registrar" element={<RegistroGuia />} />
                        <Route path="/guias/editar/:id" element={<RegistroGuia />} />
                        <Route path="/reportes" element={<GenerarReportes />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
