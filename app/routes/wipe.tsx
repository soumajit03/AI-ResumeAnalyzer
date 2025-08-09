import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        loadFiles();
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 modern-shadow border border-white/50">
                    <h1 className="text-4xl font-bold text-gray-800 mb-6">
                        Account Management
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Authenticated as:{" "}
                        <span className="font-semibold text-blue-600">
                            {auth.user?.username}
                        </span>
                    </p>

                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                            Existing Files
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="bg-gray-50/80 rounded-2xl p-4 modern-shadow border border-gray-100"
                                >
                                    <p className="text-lg font-medium text-gray-700">
                                        {file.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center">
                        <button
                            className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-4 rounded-2xl cursor-pointer font-semibold text-lg hover:scale-105 transition-all duration-300 modern-shadow"
                            onClick={() => handleDelete()}
                        >
                            Wipe App Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WipeApp;
