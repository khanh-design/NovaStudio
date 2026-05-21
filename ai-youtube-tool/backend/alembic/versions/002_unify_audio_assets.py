"""Unify audio_assets: add project_id FK."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002_unify_audio'
down_revision = 'a1b2c3d4e5f6'  # previous migration (add_audio_assets)
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'audio_assets',
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_audio_assets_project_id',
        'audio_assets', 'projects',
        ['project_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_index('ix_audio_assets_project_id', 'audio_assets', ['project_id'])


def downgrade():
    op.drop_index('ix_audio_assets_project_id', table_name='audio_assets')
    op.drop_constraint('fk_audio_assets_project_id', 'audio_assets', type_='foreignkey')
    op.drop_column('audio_assets', 'project_id')
