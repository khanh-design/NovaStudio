"""add audio_assets table

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-05-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a1b2c3d4e5f6'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'audio_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('voice', sa.String(50), nullable=False, server_default='alloy'),
        sa.Column('model', sa.String(50), nullable=False, server_default='tts-1'),
        sa.Column('language_hint', sa.String(20), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('local_path', sa.String(500), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audio_assets_created_at', 'audio_assets', ['created_at'])
    op.create_index('ix_audio_assets_status', 'audio_assets', ['status'])


def downgrade() -> None:
    op.drop_index('ix_audio_assets_status', 'audio_assets')
    op.drop_index('ix_audio_assets_created_at', 'audio_assets')
    op.drop_table('audio_assets')
