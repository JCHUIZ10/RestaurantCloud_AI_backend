<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UbigeoSeeder extends Seeder
{
    /**
     * Catálogo Maestro Oficial de Departamentos, Provincias y Distritos del Perú (INEI/SUNAT).
     */
    public function run(): void
    {
        $departamentos = [
            ['codigo' => '01', 'nombre' => 'Amazonas'],
            ['codigo' => '02', 'nombre' => 'Áncash'],
            ['codigo' => '03', 'nombre' => 'Apurímac'],
            ['codigo' => '04', 'nombre' => 'Arequipa'],
            ['codigo' => '05', 'nombre' => 'Ayacucho'],
            ['codigo' => '06', 'nombre' => 'Cajamarca'],
            ['codigo' => '07', 'nombre' => 'Callao'],
            ['codigo' => '08', 'nombre' => 'Cusco'],
            ['codigo' => '09', 'nombre' => 'Huancavelica'],
            ['codigo' => '10', 'nombre' => 'Huánuco'],
            ['codigo' => '11', 'nombre' => 'Ica'],
            ['codigo' => '12', 'nombre' => 'Junín'],
            ['codigo' => '13', 'nombre' => 'La Libertad'],
            ['codigo' => '14', 'nombre' => 'Lambayeque'],
            ['codigo' => '15', 'nombre' => 'Lima'],
            ['codigo' => '16', 'nombre' => 'Loreto'],
            ['codigo' => '17', 'nombre' => 'Madre de Dios'],
            ['codigo' => '18', 'nombre' => 'Moquegua'],
            ['codigo' => '19', 'nombre' => 'Pasco'],
            ['codigo' => '20', 'nombre' => 'Piura'],
            ['codigo' => '21', 'nombre' => 'Puno'],
            ['codigo' => '22', 'nombre' => 'San Martín'],
            ['codigo' => '23', 'nombre' => 'Tacna'],
            ['codigo' => '24', 'nombre' => 'Tumbes'],
            ['codigo' => '25', 'nombre' => 'Ucayali'],
        ];

        foreach ($departamentos as $dep) {
            DB::table('departamento')->updateOrInsert(
                ['codigo' => $dep['codigo']],
                ['nombre' => $dep['nombre']]
            );
        }

        $provincias = [
            // Áncash (02)
            ['codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Santa'],
            ['codigo' => '0201', 'departamento_codigo' => '02', 'nombre' => 'Huaraz'],
            ['codigo' => '0207', 'departamento_codigo' => '02', 'nombre' => 'Casma'],
            ['codigo' => '0211', 'departamento_codigo' => '02', 'nombre' => 'Huarmey'],
            ['codigo' => '0212', 'departamento_codigo' => '02', 'nombre' => 'Huaylas'],

            // Lima (15) y Callao (07)
            ['codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Lima'],
            ['codigo' => '1505', 'departamento_codigo' => '15', 'nombre' => 'Cañete'],
            ['codigo' => '1506', 'departamento_codigo' => '15', 'nombre' => 'Huaral'],
            ['codigo' => '1507', 'departamento_codigo' => '15', 'nombre' => 'Huarochirí'],
            ['codigo' => '1508', 'departamento_codigo' => '15', 'nombre' => 'Huaura'],
            ['codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'Callao'],

            // La Libertad (13)
            ['codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Trujillo'],
            ['codigo' => '1302', 'departamento_codigo' => '13', 'nombre' => 'Ascope'],
            ['codigo' => '1307', 'departamento_codigo' => '13', 'nombre' => 'Pacasmayo'],
            ['codigo' => '1312', 'departamento_codigo' => '13', 'nombre' => 'Virú'],

            // Arequipa (04)
            ['codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Arequipa'],
            ['codigo' => '0402', 'departamento_codigo' => '04', 'nombre' => 'Camaná'],
            ['codigo' => '0403', 'departamento_codigo' => '04', 'nombre' => 'Caravelí'],
            ['codigo' => '0404', 'departamento_codigo' => '04', 'nombre' => 'Castilla'],
            ['codigo' => '0405', 'departamento_codigo' => '04', 'nombre' => 'Caylloma'],
            ['codigo' => '0408', 'departamento_codigo' => '04', 'nombre' => 'Islay'],

            // Lambayeque (14)
            ['codigo' => '1401', 'departamento_codigo' => '14', 'nombre' => 'Chiclayo'],
            ['codigo' => '1402', 'departamento_codigo' => '14', 'nombre' => 'Ferreñafe'],
            ['codigo' => '1403', 'departamento_codigo' => '14', 'nombre' => 'Lambayeque'],

            // Piura (20)
            ['codigo' => '2001', 'departamento_codigo' => '20', 'nombre' => 'Piura'],
            ['codigo' => '2004', 'departamento_codigo' => '20', 'nombre' => 'Morropón'],
            ['codigo' => '2005', 'departamento_codigo' => '20', 'nombre' => 'Paita'],
            ['codigo' => '2006', 'departamento_codigo' => '20', 'nombre' => 'Sullana'],
            ['codigo' => '2007', 'departamento_codigo' => '20', 'nombre' => 'Talara'],

            // Cusco (08)
            ['codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'Cusco'],
            ['codigo' => '0808', 'departamento_codigo' => '08', 'nombre' => 'La Convención'],
            ['codigo' => '0813', 'departamento_codigo' => '08', 'nombre' => 'Urubamba'],

            // Ica (11)
            ['codigo' => '1101', 'departamento_codigo' => '11', 'nombre' => 'Ica'],
            ['codigo' => '1102', 'departamento_codigo' => '11', 'nombre' => 'Chincha'],
            ['codigo' => '1103', 'departamento_codigo' => '11', 'nombre' => 'Nasca'],
            ['codigo' => '1105', 'departamento_codigo' => '11', 'nombre' => 'Pisco'],

            // Junín (12)
            ['codigo' => '1201', 'departamento_codigo' => '12', 'nombre' => 'Huancayo'],
            ['codigo' => '1203', 'departamento_codigo' => '12', 'nombre' => 'Chanchamayo'],
            ['codigo' => '1206', 'departamento_codigo' => '12', 'nombre' => 'Satipo'],
            ['codigo' => '1208', 'departamento_codigo' => '12', 'nombre' => 'Tarma'],

            // San Martín (22)
            ['codigo' => '2209', 'departamento_codigo' => '22', 'nombre' => 'San Martín (Tarapoto)'],
            ['codigo' => '2201', 'departamento_codigo' => '22', 'nombre' => 'Moyobamba'],
        ];

        foreach ($provincias as $prov) {
            DB::table('provincia')->updateOrInsert(
                ['codigo' => $prov['codigo']],
                [
                    'departamento_codigo' => $prov['departamento_codigo'],
                    'nombre' => $prov['nombre'],
                ]
            );
        }

        $distritos = [
            // Áncash - Santa (0218)
            ['codigo' => '021801', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Chimbote'],
            ['codigo' => '021808', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Nuevo Chimbote'],
            ['codigo' => '021803', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Coishco'],
            ['codigo' => '021809', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Santa'],
            ['codigo' => '021807', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Samanco'],
            ['codigo' => '021806', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Nepeña'],
            ['codigo' => '021805', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Moro'],
            ['codigo' => '021804', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Macate'],
            ['codigo' => '021802', 'provincia_codigo' => '0218', 'departamento_codigo' => '02', 'nombre' => 'Cáceres del Perú (Jimbe)'],

            // Áncash - Huaraz (0201)
            ['codigo' => '020101', 'provincia_codigo' => '0201', 'departamento_codigo' => '02', 'nombre' => 'Huaraz'],
            ['codigo' => '020102', 'provincia_codigo' => '0201', 'departamento_codigo' => '02', 'nombre' => 'Independencia'],

            // Áncash - Casma (0207)
            ['codigo' => '020701', 'provincia_codigo' => '0207', 'departamento_codigo' => '02', 'nombre' => 'Casma'],
            ['codigo' => '020702', 'provincia_codigo' => '0207', 'departamento_codigo' => '02', 'nombre' => 'Buena Vista Alta'],
            ['codigo' => '020703', 'provincia_codigo' => '0207', 'departamento_codigo' => '02', 'nombre' => 'Comandante Noel'],
            ['codigo' => '020704', 'provincia_codigo' => '0207', 'departamento_codigo' => '02', 'nombre' => 'Yaután'],

            // Áncash - Huarmey (0211)
            ['codigo' => '021101', 'provincia_codigo' => '0211', 'departamento_codigo' => '02', 'nombre' => 'Huarmey'],
            ['codigo' => '021102', 'provincia_codigo' => '0211', 'departamento_codigo' => '02', 'nombre' => 'Culebras'],

            // Lima - Lima (1501)
            ['codigo' => '150122', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Miraflores'],
            ['codigo' => '150131', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'San Isidro'],
            ['codigo' => '150140', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Santiago de Surco'],
            ['codigo' => '150130', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'San Borja'],
            ['codigo' => '150104', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Barranco'],
            ['codigo' => '150116', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Magdalena del Mar'],
            ['codigo' => '150120', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Pueblo Libre'],
            ['codigo' => '150113', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Jesús María'],
            ['codigo' => '150114', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'La Molina'],
            ['codigo' => '150115', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'La Victoria'],
            ['codigo' => '150117', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Lince'],
            ['codigo' => '150141', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Surquillo'],
            ['codigo' => '150132', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'San Miguel'],
            ['codigo' => '150101', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Cercado de Lima'],
            ['codigo' => '150103', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Ate'],
            ['codigo' => '150112', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Independencia'],
            ['codigo' => '150119', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'Los Olivos'],
            ['codigo' => '150133', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'San Martín de Porres'],
            ['codigo' => '150134', 'provincia_codigo' => '1501', 'departamento_codigo' => '15', 'nombre' => 'San Juan de Lurigancho'],

            // Callao - Callao (0701)
            ['codigo' => '070101', 'provincia_codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'Callao'],
            ['codigo' => '070102', 'provincia_codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'Bellavista'],
            ['codigo' => '070104', 'provincia_codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'La Perla'],
            ['codigo' => '070105', 'provincia_codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'La Punta'],
            ['codigo' => '070106', 'provincia_codigo' => '0701', 'departamento_codigo' => '07', 'nombre' => 'Ventanilla'],

            // La Libertad - Trujillo (1301)
            ['codigo' => '130101', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Trujillo'],
            ['codigo' => '130102', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Huanchaco'],
            ['codigo' => '130107', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Víctor Larco Herrera'],
            ['codigo' => '130106', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Moche'],
            ['codigo' => '130104', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'El Porvenir'],
            ['codigo' => '130105', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Florencia de Mora'],
            ['codigo' => '130109', 'provincia_codigo' => '1301', 'departamento_codigo' => '13', 'nombre' => 'Salaverry'],

            // Arequipa - Arequipa (0401)
            ['codigo' => '040101', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Arequipa'],
            ['codigo' => '040129', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Yanahuara'],
            ['codigo' => '040103', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Cayma'],
            ['codigo' => '040104', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Cerro Colorado'],
            ['codigo' => '040102', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Alto Selva Alegre'],
            ['codigo' => '040112', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Paucarpata'],
            ['codigo' => '040119', 'provincia_codigo' => '0401', 'departamento_codigo' => '04', 'nombre' => 'Socabaya'],

            // Piura - Piura (2001)
            ['codigo' => '200101', 'provincia_codigo' => '2001', 'departamento_codigo' => '20', 'nombre' => 'Piura'],
            ['codigo' => '200104', 'provincia_codigo' => '2001', 'departamento_codigo' => '20', 'nombre' => 'Castilla'],
            ['codigo' => '200105', 'provincia_codigo' => '2001', 'departamento_codigo' => '20', 'nombre' => 'Catacaos'],
            ['codigo' => '200115', 'provincia_codigo' => '2001', 'departamento_codigo' => '20', 'nombre' => 'Veintiséis de Octubre'],

            // Lambayeque - Chiclayo (1401)
            ['codigo' => '140101', 'provincia_codigo' => '1401', 'departamento_codigo' => '14', 'nombre' => 'Chiclayo'],
            ['codigo' => '140108', 'provincia_codigo' => '1401', 'departamento_codigo' => '14', 'nombre' => 'La Victoria'],
            ['codigo' => '140106', 'provincia_codigo' => '1401', 'departamento_codigo' => '14', 'nombre' => 'José Leonardo Ortiz'],
            ['codigo' => '140112', 'provincia_codigo' => '1401', 'departamento_codigo' => '14', 'nombre' => 'Pimentel'],

            // Cusco - Cusco (0801)
            ['codigo' => '080101', 'provincia_codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'Cusco'],
            ['codigo' => '080106', 'provincia_codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'Santiago'],
            ['codigo' => '080108', 'provincia_codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'Wanchaq'],
            ['codigo' => '080105', 'provincia_codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'San Sebastián'],
            ['codigo' => '080104', 'provincia_codigo' => '0801', 'departamento_codigo' => '08', 'nombre' => 'San Jerónimo'],
        ];

        foreach ($distritos as $dist) {
            DB::table('distrito')->updateOrInsert(
                ['codigo' => $dist['codigo']],
                [
                    'provincia_codigo' => $dist['provincia_codigo'],
                    'departamento_codigo' => $dist['departamento_codigo'],
                    'nombre' => $dist['nombre'],
                ]
            );
        }
    }
}
