// QuestBank — Dynamic Taxonomy Tree Builder
// Constructs discipline > topic > content > subject hierarchy from questions

const QBTaxonomy = {

    /**
     * Build hierarchical tree from questions array.
     * Each node: { label, count, children: {} }
     */
    buildTree(questions) {
        const tree = {};

        for (const q of questions) {
            if (!q.disciplina) continue;

            // Level 1: Disciplina
            if (!tree[q.disciplina]) {
                tree[q.disciplina] = { label: q.disciplina, count: 0, children: {} };
            }
            tree[q.disciplina].count++;

            // Level 2: Tópico
            if (q.topico) {
                if (!tree[q.disciplina].children[q.topico]) {
                    tree[q.disciplina].children[q.topico] = { label: q.topico, count: 0, children: {} };
                }
                tree[q.disciplina].children[q.topico].count++;

                // Level 3: Conteúdo
                if (q.conteudo) {
                    if (!tree[q.disciplina].children[q.topico].children[q.conteudo]) {
                        tree[q.disciplina].children[q.topico].children[q.conteudo] = { label: q.conteudo, count: 0, children: {} };
                    }
                    tree[q.disciplina].children[q.topico].children[q.conteudo].count++;

                    // Level 4: Assunto
                    if (q.assunto) {
                        if (!tree[q.disciplina].children[q.topico].children[q.conteudo].children[q.assunto]) {
                            tree[q.disciplina].children[q.topico].children[q.conteudo].children[q.assunto] = { label: q.assunto, count: 0, children: {} };
                        }
                        tree[q.disciplina].children[q.topico].children[q.conteudo].children[q.assunto].count++;
                    }
                }
            }
        }

        return tree;
    },

    /**
     * Get full taxonomy path for a question
     */
    getQuestionPath(q) {
        return [q.disciplina, q.topico, q.conteudo, q.assunto].filter(Boolean).join('>');
    },

    /**
     * Get all leaf paths under a tree node
     */
    getLeafPaths(node, prefix) {
        const children = Object.entries(node.children || {});
        if (children.length === 0) return [prefix];
        return children.flatMap(([key, child]) =>
            QBTaxonomy.getLeafPaths(child, prefix + '>' + key)
        );
    },

    /**
     * Get checkbox state for a tree node given active subjects
     * Returns: 'checked', 'indeterminate', or 'unchecked'
     */
    getNodeState(nodePath, node, activeSubjects) {
        const leafPaths = QBTaxonomy.getLeafPaths(node, nodePath);
        const checkedCount = leafPaths.filter(p => activeSubjects.includes(p)).length;
        if (checkedCount === 0) return 'unchecked';
        if (checkedCount === leafPaths.length) return 'checked';
        return 'indeterminate';
    },

    /**
     * Toggle a tree node: check/uncheck all its leaf descendants
     */
    toggleNode(nodePath, node, activeSubjects) {
        const leafPaths = QBTaxonomy.getLeafPaths(node, nodePath);
        const state = QBTaxonomy.getNodeState(nodePath, node, activeSubjects);

        if (state === 'checked') {
            // Uncheck all leaves
            return activeSubjects.filter(s => !leafPaths.includes(s));
        } else {
            // Check all leaves (deduplicate)
            return [...new Set([...activeSubjects, ...leafPaths])];
        }
    },

    /**
     * Check if a question matches active subject filters
     */
    questionMatchesSubjects(question, activeSubjects) {
        if (activeSubjects.length === 0) return true;
        const path = QBTaxonomy.getQuestionPath(question);
        return activeSubjects.includes(path);
    },

    /**
     * Get unique values for a field across all questions
     */
    getUniqueValues(questions, field) {
        const values = new Set();
        for (const q of questions) {
            if (q[field] !== undefined && q[field] !== null && q[field] !== '') {
                values.add(String(q[field]));
            }
        }
        return [...values].sort();
    },
};
