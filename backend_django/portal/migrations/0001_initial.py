from django.db import migrations, models
import django.db.models.deletion
import uuid


def seed_organisational_units(apps, schema_editor):
    MineComplex = apps.get_model('portal', 'MineComplex')
    units = [
        {
            'complex_code': 'HO',
            'name': 'Head Office – Hyderabad',
            'short_label': 'Head Office',
            'unit_type': 'CORPORATE',
            'prefix': 'HO-PS',
            'bor_prefix': 'HO-BOR',
            'location': 'Khanij Bhavan, Masab Tank, Hyderabad',
            'state': 'Telangana',
            'description': 'Corporate Headquarters, Engineering Directorate, Procurement Policy & Consolidated 5-Unit MIS Hub',
            'is_corporate_access': True,
            'is_active': True,
        },
        {
            'complex_code': 'DIOM',
            'name': 'DIOM - Donimalai Iron Ore Mine',
            'short_label': 'DIOM',
            'unit_type': 'MINING_COMPLEX',
            'prefix': 'DIOM-PS',
            'bor_prefix': 'DIOM-BOR',
            'location': 'Donimalai, Ballari',
            'state': 'Karnataka',
            'description': 'Mechanised Iron Ore Mining Complex, Screening & Downhill Conveyor System',
            'is_corporate_access': False,
            'is_active': True,
        },
        {
            'complex_code': 'KIOM',
            'name': 'KIOM - Kumaraswamy Iron Ore Mine',
            'short_label': 'KIOM',
            'unit_type': 'MINING_COMPLEX',
            'prefix': 'KIOM-PS',
            'bor_prefix': 'KIOM-BOR',
            'location': 'Kumaraswamy, Ballari',
            'state': 'Karnataka',
            'description': 'Kumaraswamy Iron Ore Operations, Crushing Plant & Dispatch Logistics',
            'is_corporate_access': False,
            'is_active': True,
        },
        {
            'complex_code': 'BCH',
            'name': 'Bacheli Complex',
            'short_label': 'Bacheli',
            'unit_type': 'MINING_COMPLEX',
            'prefix': 'BCH-PS',
            'bor_prefix': 'BCH-BOR',
            'location': 'Bacheli, Dantewada',
            'state': 'Chhattisgarh',
            'description': 'Bailadila Iron Ore Mine Deposit 14, 11C & High-Capacity Beneficiation Plant',
            'is_corporate_access': False,
            'is_active': True,
        },
        {
            'complex_code': 'KDL',
            'name': 'Kirandul Complex',
            'short_label': 'Kirandul',
            'unit_type': 'MINING_COMPLEX',
            'prefix': 'KDL-PS',
            'bor_prefix': 'KDL-BOR',
            'location': 'Kirandul, Dantewada',
            'state': 'Chhattisgarh',
            'description': 'Bailadila Iron Ore Mine Deposit 5, 10, Crushing, Screening & Railway Loading',
            'is_corporate_access': False,
            'is_active': True,
        },
    ]
    for unit in units:
        MineComplex.objects.update_or_create(complex_code=unit['complex_code'], defaults=unit)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='MineComplex',
            fields=[
                ('complex_code', models.CharField(max_length=10, primary_key=True, serialize=False, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('short_label', models.CharField(blank=True, max_length=80)),
                ('unit_type', models.CharField(default='MINING_COMPLEX', max_length=30)),
                ('prefix', models.CharField(blank=True, max_length=20)),
                ('bor_prefix', models.CharField(blank=True, max_length=20)),
                ('location', models.CharField(max_length=150)),
                ('state', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('is_corporate_access', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'nmdc_mine_complexes',
            },
        ),
        migrations.CreateModel(
            name='EmployeeMaster',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('employee_name', models.CharField(max_length=200)),
                ('sap_employee_id', models.CharField(max_length=50, unique=True)),
                ('official_email', models.EmailField(max_length=254, unique=True)),
                ('mobile_number', models.CharField(max_length=20)),
                ('designation', models.CharField(max_length=150)),
                ('department', models.CharField(max_length=150)),
                ('area_of_work', models.CharField(max_length=150)),
                ('location', models.CharField(max_length=150)),
                ('employee_status', models.CharField(default='Active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('mine_complex', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='employees', to='portal.minecomplex')),
            ],
            options={
                'db_table': 'nmdc_employee_master',
            },
        ),
        migrations.CreateModel(
            name='EmployeeImportHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('filename', models.CharField(max_length=255)),
                ('uploaded_by', models.CharField(max_length=150)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('total_rows', models.PositiveIntegerField(default=0)),
                ('imported_count', models.PositiveIntegerField(default=0)),
                ('updated_count', models.PositiveIntegerField(default=0)),
                ('duplicate_count', models.PositiveIntegerField(default=0)),
                ('rejected_count', models.PositiveIntegerField(default=0)),
                ('validation_errors', models.JSONField(default=list)),
            ],
            options={
                'db_table': 'nmdc_employee_import_history',
            },
        ),
        migrations.RunPython(seed_organisational_units, migrations.RunPython.noop),
    ]
