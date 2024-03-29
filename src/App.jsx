import { useRef, useState, useCallback, useEffect } from "react";

import Places from "./components/Places.jsx";
import Modal from "./components/Modal.jsx";
import DeleteConfirmation from "./components/DeleteConfirmation.jsx";
import logoImg from "./assets/logo.png";
import AvailablePlaces from "./components/AvailablePlaces.jsx";
import { UserSelectPlacesData, userUpdatePlaces } from "./components/Http.js";
import Error from "./components/Error.jsx";

function App() {
  const selectedPlace = useRef();

  const [userPlaces, setUserPlaces] = useState([]);

  const [modalIsOpen, setModalIsOpen] = useState(false);

  const [errorHandlingModal, setErrorHandlingModal] = useState();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  function handleStartRemovePlace(place) {
    setModalIsOpen(true);
    selectedPlace.current = place;
  }

  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  // showing user selected data from database

  useEffect(() => {
    async function fetchUserPlaces() {
      setIsLoading(true);
      try {
        const places = await UserSelectPlacesData();
        setUserPlaces(places);
      } catch (error) {
        setUserPlaces(userPlaces);
        setError({
          message: error.message,
        });
      }
      setIsLoading(false);
    }
    fetchUserPlaces();
  }, []);

  async function handleSelectPlace(selectedPlace) {
    setUserPlaces((prevPickedPlaces) => {
      if (!prevPickedPlaces) {
        prevPickedPlaces = [];
      }
      if (prevPickedPlaces.some((place) => place.id === selectedPlace.id)) {
        return prevPickedPlaces;
      }
      return [selectedPlace, ...prevPickedPlaces];
    });

    // optimistic code update
    try {
      await userUpdatePlaces([selectedPlace, ...userPlaces]);
    } catch (error) {
      setUserPlaces(userPlaces);
      setErrorHandlingModal({
        message: error.message || "failed to update the data",
      });
    }
  }

  const handleError = () => {
    setErrorHandlingModal(null);
  };

  const handleRemovePlace = useCallback(
    async function handleRemovePlace() {
      setUserPlaces((prevPickedPlaces) =>
        prevPickedPlaces.filter(
          (place) => place.id !== selectedPlace.current.id
        )
      );

      setModalIsOpen(false);

      // deleting data from database
      try {
        await userUpdatePlaces(
          userPlaces.filter((place) => place.id !== selectedPlace.current.id)
        );
      } catch (error) {
        setUserPlaces(userPlaces);
        setErrorHandlingModal({
          message: error.message || "failed to Delete the data",
        });
      }
    },
    [userPlaces]
  );

  return (
    <>
      <Modal open={errorHandlingModal} onClose={handleError}>
        {errorHandlingModal && (
          <Error
            title={"an error occurred"}
            message={errorHandlingModal.message}
            onConfirm={handleError}
          />
        )}
      </Modal>
      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        {error && <Error title="an error occurred" message={error.message} />}
        {!error && (
          <Places
            title="I'd like to visit ..."
            fallbackText="Select the places you would like to visit below."
            places={userPlaces}
            onSelectPlace={handleStartRemovePlace}
            isLoading={isLoading}
            loadingText="fetching data...."
          />
        )}

        <AvailablePlaces onSelectPlace={handleSelectPlace} />
      </main>
    </>
  );
}

export default App;
