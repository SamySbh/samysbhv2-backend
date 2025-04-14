const uploadController = {
    async uploadImage(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier n\'a été uploadé'
                });
            }

            // Générer l'URL publique du fichier uploadé
            // Utiliser un chemin qui correspond à la structure de vos assets
            const imageUrl = `/uploads/${req.file.filename}`;

            return res.status(200).json({
                success: true,
                data: { imageUrl },
                message: 'Image uploadée avec succès'
            });
        } catch (error) {
            console.error('Error in uploadImage:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'upload de l\'image'
            });
        }
    }
};

export default uploadController;