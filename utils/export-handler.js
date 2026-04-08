// QuestBank — Export Handler
// Export exams, backup/restore database

const QBExport = {

    /**
     * Export selected questions as an exam JSON
     */
    exportExam(questions, config) {
        const exam = {
            titulo: config.titulo || 'Prova',
            professor: config.professor || '',
            instituicao: config.instituicao || '',
            data: config.data || new Date().toISOString().split('T')[0],
            incluir_gabarito: config.incluir_gabarito || false,
            incluir_resolucao: config.incluir_resolucao || false,
            total_questoes: questions.length,
            questoes: questions.map((q, i) => ({
                numero: i + 1,
                id: q.id,
                enunciado: q.enunciado,
                alternativas: q.alternativas || [],
                tipo: q.tipo,
                disciplina: q.disciplina,
                topico: q.topico,
                conteudo: q.conteudo,
                assunto: q.assunto,
                banca: q.banca,
                ano: q.ano,
                dificuldade: q.dificuldade,
                gabarito: config.incluir_gabarito ? q.gabarito : undefined,
                resolucao_link: config.incluir_resolucao ? q.resolucao_link : undefined,
                imagens: q.imagens || [],
            })),
            generated_at: new Date().toISOString(),
        };

        QBExport._download(
            JSON.stringify(exam, null, 2),
            `${(config.titulo || 'prova').replace(/\s+/g, '-').toLowerCase()}.json`,
            'application/json'
        );

        return exam;
    },

    /**
     * Export entire database as backup file (.questbank.json)
     */
    async exportDatabase() {
        const questions = await db.questions.toArray();
        const exams = await db.exams.toArray();
        const settings = await db.settings.toArray();

        const backup = {
            type: 'questbank-backup',
            version: '1.0',
            exported_at: new Date().toISOString(),
            stats: {
                questions: questions.length,
                exams: exams.length,
            },
            data: { questions, exams, settings },
        };

        const dateStr = new Date().toISOString().split('T')[0];
        QBExport._download(
            JSON.stringify(backup, null, 2),
            `questbank-backup-${dateStr}.questbank.json`,
            'application/json'
        );

        return backup.stats;
    },

    /**
     * Import (restore) database from a backup file
     */
    async importDatabase(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const backup = JSON.parse(e.target.result);

                    if (backup.type !== 'questbank-backup') {
                        reject(new Error('Este arquivo não é um backup válido do QuestBank.'));
                        return;
                    }

                    // Clear existing data
                    await db.questions.clear();
                    await db.exams.clear();
                    await db.settings.clear();

                    // Restore data
                    if (backup.data.questions?.length > 0) {
                        await db.questions.bulkAdd(backup.data.questions);
                    }
                    if (backup.data.exams?.length > 0) {
                        await db.exams.bulkAdd(backup.data.exams);
                    }
                    if (backup.data.settings?.length > 0) {
                        await db.settings.bulkAdd(backup.data.settings);
                    }

                    resolve({
                        questions: backup.data.questions?.length || 0,
                        exams: backup.data.exams?.length || 0,
                        exported_at: backup.exported_at,
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo de backup.'));
            reader.readAsText(file);
        });
    },

    /**
     * Helper: trigger file download
     */
    _download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};
